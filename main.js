/* Cursor halo over glass texture — raw WebGL, no deps */
(() => {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });

  if (!gl) {
    // Fallback: static background image
    canvas.style.background = 'url(assets/bg.jpg) center/cover no-repeat';
    return;
  }

  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uRes;      // canvas size in px
    uniform vec2 uImgRes;   // image size in px
    uniform vec2 uPoints[50]; // cursor + trailing chain, px, origin bottom-left
    uniform vec2 uMotion;   // cursor velocity in uv units (directional blur)
    uniform float uGlow;    // 0..1 halo strength
    uniform float uTime;

    // cover-fit uv mapping
    vec2 coverUV(vec2 uv) {
      float sa = uRes.x / uRes.y;
      float ia = uImgRes.x / uImgRes.y;
      vec2 s = (sa > ia) ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
      return (uv - 0.5) * s + 0.5;
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // 9-tap gaussian blur + directional motion blur along cursor velocity
    vec3 blurTex(vec2 uv, vec2 off, float radius) {
      vec2 px = radius / uImgRes;
      vec3 c = texture2D(uTex, uv + off).rgb * 4.0;
      c += texture2D(uTex, uv + off + vec2( px.x,  0.0)).rgb * 2.0;
      c += texture2D(uTex, uv + off + vec2(-px.x,  0.0)).rgb * 2.0;
      c += texture2D(uTex, uv + off + vec2( 0.0,  px.y)).rgb * 2.0;
      c += texture2D(uTex, uv + off + vec2( 0.0, -px.y)).rgb * 2.0;
      c += texture2D(uTex, uv + off + vec2( px.x,  px.y)).rgb;
      c += texture2D(uTex, uv + off + vec2(-px.x,  px.y)).rgb;
      c += texture2D(uTex, uv + off + vec2( px.x, -px.y)).rgb;
      c += texture2D(uTex, uv + off + vec2(-px.x, -px.y)).rgb;
      c += texture2D(uTex, uv + off + uMotion).rgb;
      c += texture2D(uTex, uv + off - uMotion).rgb;
      c += texture2D(uTex, uv + off + uMotion * 0.5).rgb;
      c += texture2D(uTex, uv + off - uMotion * 0.5).rgb;
      return c / 20.0;
    }

    void main() {
      vec2 frag = vUv * uRes;

      // halo: continuous streak from a chain of trailing points (no layers)
      float R = 0.265;                             // halo radius (× screen height)
      float glow = 0.0;
      vec2 dirField = vec2(0.0);
      float dm = 1e9;
      for (int i = 0; i < 50; i++) {
        vec2 dl = (frag - uPoints[i]) / uRes.y;
        float di = length(dl);
        float Ri = R * (1.0 - float(i) * 0.014);    // radius shrinks along the tail
        float gi = smoothstep(Ri, 0.0, di);
        gi *= gi * (1.0 - float(i) * 0.012);        // brightness fades along the tail
        glow = max(glow, gi);
        dirField += dl * gi;
        dm = min(dm, di);
      }
      glow *= 0.55 * uGlow;

      // refraction + animated ripple across the whole halo region
      vec2 dir = normalize(dirField + 1e-6);
      float ripple = sin(dm * 90.0 - uTime * 4.0) * glow * 0.03;
      vec2 refr = dir * (glow * 0.08 + ripple);
      vec2 uv = coverUV(vUv);

      // chromatic sampling on the refracted edge
      float ca = glow * 0.006;
      vec3 soft, sharp;
      soft.r  = blurTex(uv, -refr - vec2(ca, 0.0), 4.4).r;
      soft.g  = blurTex(uv, -refr, 4.4).g;
      soft.b  = blurTex(uv, -refr + vec2(ca, 0.0), 4.4).b;
      sharp.r = texture2D(uTex, uv - refr - vec2(ca, 0.0)).r;
      sharp.g = texture2D(uTex, uv - refr).g;
      sharp.b = texture2D(uTex, uv - refr + vec2(ca, 0.0)).b;

      // emphasize warm (yellow / orange-red) blocks: sharp + saturated;
      // everything else stays blurred and desaturated
      float warm = smoothstep(0.02, 0.18, soft.r - soft.b);
      vec3 col = mix(soft, sharp, warm * 0.85);
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, mix(0.396, 1.044, warm)); // global saturation -30%
      col *= mix(0.96, 1.06, warm);

      // background-only grade (fades out inside the halo):
      // extra -10% saturation + 10% contrast
      float haloM = clamp(glow * 2.2, 0.0, 1.0);
      haloM = haloM * haloM * (3.0 - 2.0 * haloM);
      vec3 bg = mix(vec3(lum), col, 0.9);
      bg = clamp((bg - 0.5) * 1.1 + 0.5, 0.0, 1.0);
      col = mix(bg, col, haloM);

      // soft screen-blend light, slightly warm
      vec3 light = vec3(1.0, 0.97, 0.90) * glow;
      col = 1.0 - (1.0 - col) * (1.0 - light);

      // color shift inside the halo: chroma mirrored around luminance
      // (warm ↔ cool, brightness preserved) — striking but easy on the eyes
      float inv = haloM;
      float lumA = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 shifted = clamp(2.0 * lumA - col, 0.0, 1.0);
      shifted = mix(vec3(lumA), shifted, 0.9);      // slight desat to soften
      col = mix(col, shifted, inv);

      // vignette
      float vig = smoothstep(1.25, 0.45, length(vUv - 0.5));
      col *= mix(0.82, 1.0, vig);

      // fine grain
      col += (hash(frag + fract(uTime) * 100.0) - 0.5) * 0.035;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const name of ['uTex', 'uRes', 'uImgRes', 'uGlow', 'uTime', 'uMotion']) {
    U[name] = gl.getUniformLocation(prog, name);
  }
  U.uPoints = gl.getUniformLocation(prog, 'uPoints[0]');

  // --- state ---
  const N = 50;
  let W = 0, H = 0, DPR = 1;
  const mouse = { x: 0, y: 0 };        // raw, css px, origin top-left
  const pts = Array.from({ length: N }, () => ({ x: 0, y: 0 })); // follow-the-leader chain
  const ptsFlat = new Float32Array(N * 2);
  let glow = 0;                        // current halo strength
  let glowTarget = 0;
  let lastX = 0, lastY = 0, lastT = performance.now();
  let started = false;
  let motionX = 0, motionY = 0;        // smoothed cursor velocity (css px/frame)
  let prevHX = 0, prevHY = 0;          // previous chain-head position
  let forcedMotion = null;             // debug override

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(canvas.clientWidth * DPR);
    H = Math.round(canvas.clientHeight * DPR);
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    if (!started) {
      mouse.x = canvas.clientWidth / 2;
      mouse.y = canvas.clientHeight / 2;
      for (const p of pts) { p.x = mouse.x; p.y = mouse.y; }
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // debug preview: ?mx=0.7&my=0.4&g=0.9 pins the halo for screenshots
  let pinned = false;
  let frozen = false;
  const q = new URLSearchParams(location.search);
  if (q.has('mx') || q.has('my') || q.has('g')) {
    pinned = true;
    started = true;
    mouse.x = canvas.clientWidth * parseFloat(q.get('mx') || '0.5');
    mouse.y = canvas.clientHeight * parseFloat(q.get('my') || '0.5');
    // optional: ?tx=0.3&ty=0.6 spreads the chain along a line to simulate a streak
    const tx = parseFloat(q.get('tx') || q.get('mx') || '0.5') * canvas.clientWidth;
    const ty = parseFloat(q.get('ty') || q.get('my') || '0.5') * canvas.clientHeight;
    pts.forEach((p, i) => {
      const k = i / (N - 1);
      p.x = mouse.x + (tx - mouse.x) * k;
      p.y = mouse.y + (ty - mouse.y) * k;
    });
    frozen = q.has('tx');   // keep the simulated streak in place
    if (q.has('vx') || q.has('vy')) {
      forcedMotion = { x: parseFloat(q.get('vx') || '0'), y: parseFloat(q.get('vy') || '0') };
    }
    glow = glowTarget = parseFloat(q.get('g') || '0.9');
  }

  window.addEventListener('pointermove', (e) => {
    started = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // velocity charges the glow
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt; // px/ms
    glowTarget = Math.min(1, 0.35 + speed * 1.2);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });

  // --- texture ---
  let imgW = 1, imgH = 1, ready = false;
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 1x1 placeholder while loading
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE,
    new Uint8Array([11, 13, 16]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    imgW = img.naturalWidth;
    imgH = img.naturalHeight;
    ready = true;
  };
  img.src = 'assets/bg.jpg';

  // --- loop ---
  const t0 = performance.now();
  function frame() {
    const t = (performance.now() - t0) / 1000;

    // follow-the-leader chain: each point chases the previous one,
    // so the glow forms a continuous streak along the cursor path
    if (!frozen) {
      pts[0].x += (mouse.x - pts[0].x) * 0.45;
      pts[0].y += (mouse.y - pts[0].y) * 0.45;
      for (let i = 1; i < N; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.45;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.45;
      }
    }
    for (let i = 0; i < N; i++) {
      ptsFlat[i * 2] = pts[i].x * DPR;
      ptsFlat[i * 2 + 1] = H - pts[i].y * DPR;
    }

    // smoothed cursor velocity → directional motion blur (uv units)
    const vx = forcedMotion ? forcedMotion.x : pts[0].x - prevHX;
    const vy = forcedMotion ? forcedMotion.y : pts[0].y - prevHY;
    prevHX = pts[0].x; prevHY = pts[0].y;
    motionX += (vx - motionX) * 0.12;
    motionY += (vy - motionY) * 0.12;
    let mx = (motionX * DPR / W) * 0.08;
    let my = -(motionY * DPR / H) * 0.08;   // y flip: css → gl coords
    const mlen = Math.hypot(mx, my);
    if (mlen > 0.012) { mx *= 0.012 / mlen; my *= 0.012 / mlen; }

    // glow: fast attack, very slow disperse; gentle breathing when idle
    if (!pinned) {
      glowTarget *= 0.996;
      const idle = 0.12 + 0.05 * Math.sin(t * 0.8);
      glow += (Math.max(glowTarget, started ? glowTarget : idle) - glow) * 0.06;
    }

    gl.uniform1i(U.uTex, 0);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform2f(U.uImgRes, imgW, imgH);
    gl.uniform2fv(U.uPoints, ptsFlat);
    gl.uniform2f(U.uMotion, mx, my);
    gl.uniform1f(U.uGlow, glow);
    gl.uniform1f(U.uTime, t);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  frame();
})();
