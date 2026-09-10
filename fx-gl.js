/* 液态水波折射背景层 —— 原生 WebGL，无依赖。
   单全屏 fragment shader：渐变场 + 6 高光立体球 + 域扭曲 FBM 水波折射。
   - 球体视觉与 CSS v2 一致（柔亮斑 + 饱和核 + 7 停光晕），运动关键帧一致
   - uSbw 分区：左侧栏区清晰，外部解析式软团（等效逐球 blur，出血 r1.8）
   - 右侧雾化区：沿浮动速度的各向异性高斯核（动感模糊拖影 + 高斯模糊）+ 饱和度补偿
   - 折射：球体边缘按光晕梯度位移背景场采样（液态透镜）；整体慢速水波流动
   - 单 canvas 合成层，无 url() 滤镜/SMIL/整屏 backdrop blur（教训 1 的不闪路径）
   渐进增强：WebGL 不可用时回退 CSS 双层（.fx-bg/.fx-bubbles 不隐藏）。 */
(() => {
  const canvas = document.getElementById('fx-gl');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) return; // 回退：body 不加 gl-ok，CSS 层保持可见

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;      // CSS px 视口
    uniform float uDpr;      // devicePixelRatio（≤2），gl_FragCoord 设备 px → CSS px 换算
    uniform float uTime;     // 秒
    uniform float uSbw;      // 侧栏宽 px（清晰区 x < uSbw，80px 羽化）
    uniform float uTheme;    // 0 light / 1 dark
    uniform float uScroll;   // scrollY px（顶部接缝跟随）
    uniform vec3  uBg;       // 页面底色（顶部接缝混入）
    uniform vec4  uPos[6];   // xy: base 位置(视口比例), z: 尺寸 px, w: 动画时长 s
    uniform vec3  uCore[6];  // 核色
    uniform vec3  uHalo[6];  // 晕色
    uniform float uCoreA[6]; // 核 alpha

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(11.3, 7.9); a *= 0.5; }
      return v;
    }
    // 渐变场：对角多停渐变（与 .fx-gradient 同色同停点），42s 周期原地呼吸。
    // 场区保持纯净（任何可见场纹在大窗口下都聚成"云朵"，用户两次判丑）；
    // 液态感由球体浮动 + 球缘折射承担
    vec3 fieldColor(vec2 uv, float t) {
      // 不行进的渐变：视口内永远只见 c2→c3 一段平滑切片（0.10× 跨度 + ±0.03 呼吸），
      // 线性漂移会让色停边界轮番扫过视口=“蓝白交替波浪带”（被用户点名去掉）
      float d = (uv.x - uv.y) * 0.10 + 0.5 + 0.03 * sin(t * 0.1496); // 0.1496 = 2π/42
      vec3 c;
      if (uTheme < 0.5) {
        // 浅色：同色族压深一档——0.15 丝滑场太淡会让球体"溺水"（用户判下半部清晰度不够）
        vec3 c0 = vec3(0.824, 0.894, 0.957); // #d2e4f4
        vec3 c1 = vec3(0.663, 0.820, 0.937); // #a9d1ef
        vec3 c2 = vec3(0.859, 0.914, 0.965); // #dbe9f6
        vec3 c3 = vec3(0.686, 0.824, 0.937); // #afd2ef
        vec3 c4 = vec3(0.761, 0.867, 0.953); // #c2ddf3
        float s = fract(d * 5.0);
        if      (s < 0.2) c = mix(c0, c1, s * 5.0);
        else if (s < 0.4) c = mix(c1, c2, (s - 0.2) * 5.0);
        else if (s < 0.6) c = mix(c2, c3, (s - 0.4) * 5.0);
        else if (s < 0.8) c = mix(c3, c4, (s - 0.6) * 5.0);
        else              c = mix(c4, c0, (s - 0.8) * 5.0);
      } else {
        // #1f2a33 → #262420 → #22303a → #2b2620 → #1f2a33（25% 等停）
        vec3 c0 = vec3(0.122, 0.165, 0.200);
        vec3 c1 = vec3(0.149, 0.141, 0.125);
        vec3 c2 = vec3(0.133, 0.188, 0.227);
        vec3 c3 = vec3(0.169, 0.149, 0.125);
        float s = fract(d * 4.0);
        if      (s < 0.25) c = mix(c0, c1, s * 4.0);
        else if (s < 0.5)  c = mix(c1, c2, (s - 0.25) * 4.0);
        else if (s < 0.75) c = mix(c2, c3, (s - 0.5) * 4.0);
        else               c = mix(c3, c0, (s - 0.75) * 4.0);
      }
      return c;
    }
    // 球体浮动关键帧（与 CSS bubble-float 一致）：返回 (translateY px, scaleX, scaleY)
    vec3 floatKf(float p) {
      // p ∈ [0,1)；停点 0/25/50/75/100
      float seg, sx0, sy0, sx1, sy1;
      float ty0, ty1;
      if (p < 0.25)      { seg = p / 0.25;          ty0 = 0.0;   ty1 = -18.0; sx0 = 1.0;  sy0 = 1.0;   sx1 = 1.02; sy1 = 0.99; }
      else if (p < 0.5)  { seg = (p - 0.25) / 0.25; ty0 = -18.0; ty1 = -7.0;  sx0 = 1.02; sy0 = 0.99;  sx1 = 0.99; sy1 = 1.01; }
      else if (p < 0.75) { seg = (p - 0.5) / 0.25;  ty0 = -7.0;  ty1 = -22.0; sx0 = 0.99; sy0 = 1.01;  sx1 = 1.01; sy1 = 0.985; }
      else               { seg = (p - 0.75) / 0.25; ty0 = -22.0; ty1 = 0.0;   sx0 = 1.01; sy0 = 0.985; sx1 = 1.0;  sy1 = 1.0; }
      seg = seg * seg * (3.0 - 2.0 * seg); // 关键帧处速度归零：消除线性段的急停反转（"果冻式上下弹"来源，用户点名修复）
      return vec3(mix(ty0, ty1, seg), mix(sx0, sx1, seg), mix(sy0, sy1, seg));
    }
    // 7 停光晕曲线（归一化，r ∈ [0,1]）：与 CSS v2 一致
    float haloShape(float r) {
      if (r >= 1.0) return 0.0;
      if (r < 0.20) return mix(1.0, 0.865, r / 0.20);
      if (r < 0.35) return mix(0.865, 0.63, (r - 0.20) / 0.15);
      if (r < 0.50) return mix(0.63, 0.40, (r - 0.35) / 0.15);
      if (r < 0.65) return mix(0.40, 0.21, (r - 0.50) / 0.15);
      if (r < 0.80) return mix(0.21, 0.08, (r - 0.65) / 0.15);
      return mix(0.08, 0.0, (r - 0.80) / 0.20);
    }
    // 模糊变体（等效 CSS 逐球 blur 32-64px）：高斯宽尾雾团——右侧非玻璃区要"雾化柔团"
    // 宽度 1.7→1.2（用户新指令"再加一些模糊"，覆盖旧平衡点；峰值 0.85 不动；
    // 更宽更平的尾部同时让云团边缘融进亮场更丝滑——修"白光突然变小"断点）
    float haloShapeBlur(float r) {
      return exp(-(r * 1.2) * (r * 1.2)) * 0.85;
    }

    void main() {
      vec2 css = gl_FragCoord.xy / uDpr;  // 设备 px → CSS px
      css.y = uRes.y - css.y;             // y 翻转为向下（与布局一致）
      float t = uTime;

      vec2 uvn = vec2(css.x / uRes.x, css.y / uRes.y);
      // 背景场（纯净渐变）
      vec3 col = fieldColor(uvn, t);
      // 顶部接缝：与 .fx-bg 的 mask 完全一致——文档顶 480px 线性露出（element 坐标），
      // 视口 y + scrollY 即文档 y。线性，无 smoothstep 边界问题
      float alpha = clamp((css.y + uScroll) / 480.0, 0.0, 1.0);
      col = mix(uBg, col, alpha);

      // 清晰/模糊分区（80px 羽化，与 CSS mask 一致）
      float blurZone = smoothstep(uSbw - 40.0, uSbw + 40.0, css.x);
      float elemA = (uTheme < 0.5) ? 0.8 : 0.7; // .bubble 元素 opacity

      for (int i = 0; i < 6; i++) {
        vec2 base = vec2(uPos[i].x * uRes.x, uPos[i].y * uRes.y);
        float size = uPos[i].z;
        float dur = uPos[i].w;
        vec3 kf = floatKf(fract(t / dur));
        vec2 c = base + vec2(0.0, kf.x) + vec2(size * 0.5);
        // 椭圆距离（squash 液滴感）
        vec2 dvec = (css - c) / vec2(kf.y, kf.z);
        float r = length(dvec) / (size * 0.5);
        if (r > 3.75) continue; // 左区 1.5× 放大后影响域到 2.5×1.5（清晰变体实际到 1.5）
        // 左区球体整体放大 2.0×（用户：同一球左右大小差过大）。
        // 1.5× 后用户要"清晰一倍"（aSharp 伽马 2.0），伽马让可见光晕缩到 ~0.75×——
        // 放大倍率同步 1.5→2.0 抵消，清晰度不变、可见尺寸回到与右区云团相当
        float rEff = mix(r / 2.0, r, blurZone);
        // 清晰/模糊变体混合
        // aSharp 伽马 2.0 锐化（用户：左区放大后不够清晰，"调清晰一倍"——
        // 峰值不变、中段陡降，球缘更干脆；右区 aBlur 不受影响）
        float aSharp = pow(haloShape(rEff), 2.0);
        float aBlur = haloShapeBlur(rEff);
        // 右侧非玻璃区：动感模糊 + 高斯模糊——沿浮动速度方向的各向异性高斯核
        // （对称快门式拖影；左区 blurZone≈0 跳过，保持清晰；核峰归一不改 haloShapeBlur 宽度/峰值）
        if (blurZone > 0.003) {
          vec3 kfP = floatKf(fract((t - 0.12) / dur));
          vec2 cP = base + vec2(0.0, kfP.x) + vec2(size * 0.5);
          vec2 vel = (c - cP) / 0.12;               // px/s
          float spd = length(vel);
          vec2 vdir = (spd > 0.001) ? vel / spd : vec2(0.0, 1.0);
          vec2 vperp = vec2(-vdir.y, vdir.x);
          float trail = min(spd * 16.0, size * 0.25); // 拖影长 px（用户从 8.3× 回调加强：右区要可见动感）
          float perpW = min(trail * 0.25, 6.0);        // 垂直方向固定微散（保持方向性）
          float sum = 0.0, wsum = 0.0;
          for (int k = 0; k < 7; k++) {
            float fk = float(k) / 3.0 - 1.0;         // -1..1 沿运动方向
            for (int q = 0; q < 3; q++) {
              float fq = float(q) - 1.0;             // -1..1 垂直方向
              vec2 off = vdir * (fk * trail) + vperp * (fq * perpW);
              float w = exp(-2.2 * (fk * fk + fq * fq)); // 高斯权重
              vec2 dv2 = (css - c - off) / vec2(kf.y, kf.z);
              float rr = length(dv2) / (size * 0.5);
              sum += haloShapeBlur(rr) * w;
              wsum += w;
            }
          }
          aBlur = mix(aBlur, sum / wsum, blurZone);
        }
        // 雾化区 alpha 略增（+12%）：补拖影核归一化造成的峰值损失，提升雾团色彩存在
        float a = mix(aSharp, aBlur, blurZone) * uCoreA[i] * elemA * (1.0 + blurZone * 0.12);
        if (a < 0.004) continue;
        // 边缘折射：按光晕梯度位移背景采样（液态透镜）
        float g = haloShape(max(rEff - 0.03, 0.0)) - haloShape(min(rEff + 0.03, 1.0));
        vec2 nrm = (r > 0.001) ? normalize(dvec) : vec2(0.0);
        vec2 roff = nrm * g * 13.0 * (1.0 - blurZone * 0.7);
        vec3 behind = fieldColor(vec2((css.x + roff.x) / uRes.x, (css.y + roff.y) / uRes.y), t);
        vec3 bcol = mix(uHalo[i], uCore[i], smoothstep(0.5, 0.0, rEff));
        // 柔亮斑（左上 32% 28%，22% 衰减；随左区 1.5× 同步放大）
        vec2 hp = (css - c) / (size * 0.75) - vec2(-0.36, -0.44); // 局部坐标（亮斑位）
        float sheen = smoothstep(0.22, 0.0, length(hp)) * ((uTheme < 0.5) ? 0.55 : 0.40);
        bcol = mix(bcol, vec3(1.0), sheen * (1.0 - blurZone));
        // 右侧雾化区饱和度补偿：雾化让观感偏淡，提到左侧 ~90% 水平
        // （只提 bcol 饱和度，不动 haloShapeBlur 宽度/峰值——1.2/0.85 是认可平衡点；
        //   超色域时整体归一保色相降明度，不用 clamp——clamp 会把紫色拉成品红；
        //   补偿随半径渐退（r0.4→1.1）：云团边缘回到自然晕色融进亮场，
        //   否则高饱和蓝边贴着近白场区会形成"白光突然变小"的断点）
        float luma = dot(bcol, vec3(0.299, 0.587, 0.114));
        vec3 boosted = mix(vec3(luma), bcol, 1.85);
        float bmax = max(boosted.r, max(boosted.g, boosted.b));
        if (bmax > 1.0) boosted /= bmax;
        bcol = mix(bcol, boosted, blurZone * (1.0 - smoothstep(0.4, 1.1, r)));
        // 液态透镜：球体内背景先按折射偏移（behind），再叠球色
        col = mix(behind, bcol, a);
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('fx-gl shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('fx-gl link:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ['uRes', 'uDpr', 'uTime', 'uSbw', 'uTheme', 'uScroll', 'uBg', 'uPos', 'uCore', 'uHalo', 'uCoreA'])
    U[n] = gl.getUniformLocation(prog, n);

  // 6 球配置（与 CSS 布点/时长一致；已删 b3/b5/b7——右区叠放太密被用户点名）：[left%, top%, size px, dur s]
  const POS = [
    [0.43, -0.06, 420, 22], [0.84, 0.10, 300, 19],
    [0.06, 0.46, 350, 24], [0.15, 0.80, 140, 16],
    [0.56, 0.46, 260, 21], [0.49, 0.74, 200, 13],
  ];
  const LIGHT = {
    core: [[96, 165, 224], [158, 132, 235], [120, 145, 235], [178, 158, 240], [158, 132, 235], [96, 165, 224]],
    halo: [[125, 180, 224], [179, 158, 238], [141, 163, 235], [198, 182, 245], [179, 158, 238], [125, 180, 224]],
    coreA: [0.95, 0.9, 0.9, 0.9, 0.9, 0.95],
    bg: [1, 1, 1],
  };
  const DARK = {
    core: [[74, 124, 178], [122, 96, 190], [94, 112, 186], [146, 126, 206], [122, 96, 190], [74, 124, 178]],
    halo: [[82, 132, 186], [134, 108, 202], [102, 120, 198], [156, 136, 216], [134, 108, 202], [82, 132, 186]],
    coreA: [0.85, 0.8, 0.8, 0.8, 0.8, 0.85],
    bg: [0.106, 0.106, 0.102], // #1b1b1a
  };
  const flat = (arr, k) => { const out = []; for (const c of arr) out.push(c[0] / 255 * (k || 1), c[1] / 255 * (k || 1), c[2] / 255 * (k || 1)); return out; };

  const setTheme = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const p = dark ? DARK : LIGHT;
    gl.uniform1f(U.uTheme, dark ? 1 : 0);
    gl.uniform3fv(U.uCore, flat(p.core));
    gl.uniform3fv(U.uHalo, flat(p.halo));
    gl.uniform1fv(U.uCoreA, p.coreA);
    gl.uniform3fv(U.uBg, p.bg);
  };
  gl.uniform4fv(U.uPos, POS.flat());
  setTheme();
  new MutationObserver(setTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const d = DPR();
    canvas.width = Math.round(window.innerWidth * d);
    canvas.height = Math.round(window.innerHeight * d);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  // WebGL 就绪：隐藏 CSS 背景层（.fx-bg/.fx-bubbles×2 由 body.gl-ok 规则隐藏）
  document.body.classList.add('gl-ok');

  const sbwEl = document.documentElement;
  let t0 = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (!document.body.classList.contains('hero-gone')) return; // hero 阶段不渲染（opacity 0 且省 GPU）
    const d = DPR();
    gl.uniform2f(U.uRes, canvas.width / d, canvas.height / d);
    gl.uniform1f(U.uDpr, d);
    gl.uniform1f(U.uTime, (now - t0) / 1000);
    const sbw = parseFloat(sbwEl.style.getPropertyValue('--sbw')) || 0;
    gl.uniform1f(U.uSbw, sbw * (window.matchMedia('(min-width: 1024px)').matches ? 1 : 0));
    gl.uniform1f(U.uScroll, window.scrollY || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(frame);
})();
