# 交接文档 4 — 液态玻璃实验续（portfolio-hero-backup-20260910）

> 写给下一棒 agent。本文档记录本对话（液态玻璃实验续篇）的全部工作、特点、用户偏好、经验教训与待办指令。
> 之前历史见 `HANDOFF3.md`（液态玻璃实验上篇：双主题玻璃体系、球体 v2、边缘光 v1、闪烁三轮救火、主项目交接见 `portfolio-hero/HANDOFF2.md`）。**主项目没让动别动**。

## 0. 一句话现状

当前本地版本 **fx-gl.js v20260910x / main.js v20260910zb**（纯本地实验，未上线）。线上是 **cb90eb1**（CSS 版 v3：7 停光晕球体 + 连续边缘微光，本对话中由用户发话上线）。

- 本地预览：`http://localhost:8980/`（`serve_nocache.py` 禁缓存服务器，刷新即最新；**改 JS 子资源必须 bump `?v=`**，当前 fx-gl 20260910x / main 20260910zb）
- 背景已由 **WebGL 重构**（fx-gl.js，原生 WebGL 无依赖，单全屏 fragment shader）；CSS 双层背景保留作回退兜底（`body.gl-ok` 才隐藏，WebGL 不可用自动回退）
- **封面已回退到 I BELIEVE 之前**（20260910zb，用户点名）：main.js 从 git 原版恢复，`.hero-believe` DOM/CSS 删除，`assets/believe.png` 删除（备份 `/tmp/believe_backup.png`）。I BELIEVE  saga（§1 第 17-20 条）全部作废，仅留作经验
- **待办 1 已完成**（20260910q→r）：右侧雾化区饱和度补偿 + 动感模糊 + 高斯模糊。**用户验收后四连反馈已修（20260910s）**：① 拖影幅度→1/3（`spd×8.3`，cap `size×0.13`）；② b1 左移直径 40%（left 52%→43%，fx-gl POS 与 CSS 同步）；③ 渐变场波浪带去除（线性漂移改 ±0.03 原地呼吸，跨度 0.10×，视口内永远只见 c2→c3 一段平滑切片）；④ 果冻式上下弹修复（floatKf 段内 smoothstep 缓动，关键帧处速度归零；CSS keyframes 同步加 ease-in-out）。**后续：右区加模糊 + 右缘白光断点修复（20260910t，见 §1 第 13 条）**

## 1. 本对话做了什么（按顺序）

1. **接手 HANDOFF3 收尾待办 1-3**：① 偶发闪烁用自搭 CDP rig 在 120Hz ProMotion 实测定性（soak 全绿，无单一机制，双层 mask 排除，saturate(1.7) 经 A/B 验证显著不可砍）；② 球体边缘光晕 v1（核收 30%）后被用户抓到环状断点，迭代为 **v2 定稿（7 停平滑衰减 + 亮斑 ≤0.55）**；③ 深色主题全项验收通过
2. **侧栏右缘连续微发光**（细亮芯 `inset -2px 0 6px` + 宽晕影 `inset -8px 0 20px`）——边缘只有细亮线时中段会被亮背景吃掉形成"断点"（被用户圈图抓到）
3. **上线 cb90eb1**（CSS 版 v3：7 停光晕球体 + 连续边缘微光；用户发话后按"拷贝进主库提交推送"流程上线，Pages 验证 200）
4. **WebGL 液态水波折射层**（fx-gl.js，用户点名"WebGL 路径做液态水波折射，重构背景，高质量验收"）：全屏 shader 渐变场 + 9 球 + FBM 水波。随后用户五连反馈迭代定稿：① 场区去波纹恢复纯净渐变（"雷霆大波浪"判丑，渐变周期拉到 0.15× 视口丝滑无带）；② 右侧非玻璃区高斯雾化 `exp(-(r×1.7)²)×0.85`（r 到 1.8，用户认可的平衡点）；③ 删 b3/b5/b7（右区叠放太密，两次点名删球，9→6 球，CSS 双层同步删）；④ 折射位移 26→13px（减半）；⑤ 浅色场压深一档（球体在丝滑场上"溺水"，清晰度不够）
5. **水润光泽**：CSS 表面水光（115° 光泽亮带 0.5 峰 + 太阳高光点 + 顶部天空光）；canvas 焦散亮丝（脊状噪声水光纹）被用户以"丑的快死了"否决，已回滚
6. **边缘光重构**：四边统一 1.2px 亮描边 + 软光晕（所有边缘光效均匀，左缘不再裸边）+ 顶部受光高光（`inset 0 2px 4px`）+ 底部微阴影（`inset 0 -3px 8px`）= 微微立体
7. **抓出并修复两个真 bug**：DPR 单位（`gl_FragCoord` 设备 px 需除 `uDpr`，DSF1 无头测不出）、smoothstep 除零 NaN 洗白（seam 边界重合时）
8. **右区饱和度 + 双模糊（待办 1，20260910r 完成）**：① 饱和度补偿——`bcol` 按 luma 外推 1.85，超色域**整体归一保色相**（clamp 会把紫色拉成品红，归一降明度保色相，紫色观感饱和度 0.55→0.62）；② 动感模糊——有限差分求浮动速度（dt 0.12s），沿速度方向 7×3 各向异性高斯核（对称快门式）；③ 高斯模糊——核内高斯权重 + 雾化区 alpha +12%（补拖影核归一化的峰值损失，"略增 alpha" 是 HANDOFF 许可方向）；④ 左区 `blurZone≈0` 全跳过，清晰不变；⑤ 球体剔除半径 1.8→2.5（拖影拉长影响域）
9. **用户验收四连反馈（20260910s 修复）**：① "右侧玻璃不覆盖时形变幅度过大"→拖影缩到 1/3（`spd×8.3`，cap `size×0.13`，perpW ≤3.5px）——**用户对形变的容忍度比预估低得多，效果强度先按"勉强可见"给**；② 圈图点名 b1 左移自身直径 40%（420px→168px≈视口 8.75%）：left 52%→43%，fx-gl POS 与 CSS 同步改；③ "左上到右下蓝白交替波浪带"——根因是 fieldColor 的线性漂移 `t/42`：色停边界每 ~8.4s 轮番扫过视口。修复：漂移改 `0.03×sin(2πt/42)` 原地呼吸 + 跨度 0.15→0.10（视口切片落在单个色停过渡 c2→c3 内），fract 删除；④ "静止时球体像果冻上下弹"——根因是 floatKf 线性段：关键帧处速度瞬时反转=弹。修复：段内 smoothstep 缓动（关键帧处速度归零），CSS keyframes 同步逐停加 `ease-in-out`（缓动后拖影在转向处自然收缩，更物理）
10. **JAIME 标题改 Anton 字体**：Google Fonts（OFL 免费）拉丁子集已下载本地化 `assets/fonts/anton-latin-400.woff2`（12KB），`<style>` 顶部 `@font-face` + `.side-name { font-family: "Anton", "Bebas Neue", ...; font-weight: 400 }`（Anton 本身即粗展示体，900 会触发合成加粗糊边）。随后用户点名：文案 `JAIME`→`JAIME GU`，letter-spacing 0.16em→0.208em（+30%）。**上线时必须把 `assets/` 一起拷走**
11. **侧栏真实照片嵌入（`.side-photo`）**：`assets/photo.jpg`（1920×2880→262KB，object-fit cover）替换渐变占位底 + "PHOTO" 文字，保留原定位/尺寸/圆角。四项处理全部落地：① 冷调 `hue-rotate(-8deg) saturate(0.88) brightness(1.02)` 加在 img 上（**验收时球鞋橙黄无脏色，备选 sepia 方案未启用**）；② 玻璃嵌合 `border: 1px solid rgba(255,255,255,0.7)` + 内发光三件套（与页面其他卡片一致；深色另写较弱一组 border 0.22 / inset 0.18/0.03）；③ 下缘羽化 `mask-image: linear-gradient(to bottom, black 56%, transparent)`（带 -webkit- 前缀，其余三边硬切；**用户圈图点名羽化区抬高一倍：22%→44%，起点 78%→56%**）；④ `::after` 蓝紫薄层 `linear-gradient(160deg, rgba(125,180,224,0.12), rgba(179,158,238,0.10))` + pointer-events:none。深浅两主题 + DPR2 验收全绿。后用户点名"整张照片加动感模糊"：**烘焙进 `assets/photo.jpg`**（numpy FFT 卷积，25×25 定向核：沿 ↖↘ 跃起方向 35°、轴向 σ6.5px、垂直 σ1.1px；原图备份 `/tmp/photo_backup_nomotion.jpg`）——不走 SVG url() 滤镜（禁令），零运行时开销；卡片实尺寸下呈追焦动感，不过度。再后用户点名"立体高光 + 盖住照片里的烟"：继续烘焙（备份 `/tmp/photo_backup_noflare.jpg`）——① 指缝太阳光斑盖烟（左手 (100,1440)：亮核 σ26/α0.95 + 中晕 σ85/α0.5 + 冷色大晕 σ210/α0.22 + 斜向光丝 300×15px/-32°/α0.32，screen 混合，逆光场景光从指缝迸出最自然）；② 右上太阳方向大环境光 σ950/α0.22（与飞机云同侧，拉出光的来向）；③ 轻 S 曲线 `s+0.24·s(1-s)(2s-1)` 增立体感。再后用户点名"类似重影的模糊"：烘焙双残影（备份 `/tmp/photo_backup_noghost.jpg`）——沿动感轴 35° 错位叠加：主残影 (20,14)px×0.19 + 二次淡影 (40,28)px×0.09（残影拖在运动后方右下，edge 复制 padding 防黑边）
12. **侧栏竖排标语**：下移 20vh→24vh；词间距 `word-spacing: 0.6em`；字体按用户圈图改 **Montserrat 500**（几何无衬线，OFL 免费，`assets/fonts/montserrat-latin-500.woff2` 16KB + `@font-face`），弃用原 Arial Narrow 窄体；文案后改为 `Be Creative | Be Real | Be Faithful | With Taste`（混合大小写，去掉 text-transform: uppercase；加粗 700 被用户当场撤回，保持 500）；后点名与照片间距缩到 1px（`left: calc(43.6% + 1px)`）；占位中文 `.side-bio` 段落已删（CSS 规则保留备用）
13. **右区加模糊 + 玻璃右缘白光断点修复（20260910t）**：① "右侧非玻璃区再加一些模糊"——haloShapeBlur 宽度 1.7→1.2（用户新指令覆盖旧平衡点，峰值 0.85 不动），perpW 3.5→6px；② "玻璃右缘白光突然变小"——像素剖面（三版本对照 + 禁用投影 A/B）证实元凶是 **`.sidebar` 投影 `16px 0 48px rgba(31,42,55,0.10)`**：在玻璃右缘（--sbw=视口×0.65，1600px 窗口=1040px）把云团压暗 ~11%，云团亮处在边缘形成掐断。修复：投影调轻加宽 0.055/56px（深色 0.40→0.25），压暗降到 ~4% 不可辨；辅助：饱和度补偿随半径渐退（`blurZone × (1 - smoothstep(0.4, 1.1, r))`，核心保持 1.85，边缘回自然晕色融进亮场）
14. **右区动感模糊加强（20260910u）**：用户点名"右侧非玻璃区加动感模糊"——拖影 `spd×8.3`→`spd×16.0`（介于 8.3 不可见与 25 被判过大之间的中间量级），cap `size×0.13`→`size×0.25`。高斯 1.2 放宽后拖影读起来是柔和方向性拉雾，不是硬 streak
15. **左区球体放大（20260910v）**："同一球体左右两边大小差异过大，左边扩大到只比右边小一点点"——清晰光晕到 r=1.0 vs 雾化高斯到 r≈1.7 是根因。左区整球按 1.5× 渲染（`rEff = mix(r/1.5, r, blurZone)`：光晕/核/亮斑/折射同一缩放，边界羽化带内半径插值尺寸连续）；剔除半径 2.5→3.75。右区不变。**注意 CSS v2 光晕曲线 parity 已被用户此指令覆盖（左区球比 CSS 兜底大 1.5×）**
16. **左区清晰度 + 尺寸再平衡（20260910w/x）**：① "调清晰一倍"——`aSharp = pow(haloShape(rEff), 2.0)`（峰值不变、中段陡降、球缘更干脆）；② 伽马让可见光晕缩到 ~0.75×，用户随即指出"大小差距又变大，有没有不改变清晰度缩小差距的方法"——放大倍率 1.5→2.0 抵消伽马收缩（可见尺寸 ≈ 伽马前 1.5× 版本，清晰度保留）。**调参连锁反应教训：改幅度类参数后要回看之前验收过的维度**
17. **I BELIEVE 压扁字（20260910w→x，三次改向）**：参考图复刻——Anton（与 JAIME 同字体）`scaleY(0.75)` 压扁 + `Everything we imagine can be real` 副标语。放置位置用户连续纠偏：侧栏照片背后（错）→ hero 封面 DOM 叠层（错，"不是前面"）→ **最终：藏在封面金属 canvas 背后**（`.hero-believe { z-index: -1 }` + `.hero { z-index: 0 }` 建层叠上下文，垫在不透明 canvas 之下完全隐藏）；字号按"放大一倍"给到 clamp(8rem, 18vw, 20rem)。曾备选的"烘进 bg.jpg 纹理"方案未采用（用户叫停在途）。** Anton/Montserrat TTF 已存 /tmp（/tmp/Anton-Regular.ttf、/tmp/Montserrat-Var.ttf）备用**
18. **封面黑洞效果（main.js）**：用户点名"光圈放大 50% + 中心做黑洞，把液态玻璃吸走，圈内透出一点 I BELIEVE"——① 光晕半径 `R 0.265→0.3975`；② 烘 `assets/believe.png`（2560×1440 透明 PNG，与 bg.jpg 同尺寸同一 coverUV 采样对齐：Anton 470px 白字压扁 0.75 居中 + Montserrat 副标语 + 1.6px 微糊融景）；③ main.js 加第二纹理 `uTexBel`（TEXTURE1，加载后恢复 `activeTexture(TEXTURE0)`）+ shader 黑洞段：`hole = 1-smoothstep(R*0.12, R*0.5, dm)`（**边界递增，教训**）平滑后 `col *= 1-hole*0.88`（吸走液态效果近黑）+ `mix(col, bel.rgb×暖白, bel.a×hole×0.9)`（圈内透字）；④ main.js 补 `?v=` 版本号（此前一直没有，违反子资源版本号规则）
19. **黑洞四轮迭代（20260910y/z）**：① 白底黑字（用户点名反转）：believe.png 改白底 + 黑字；② "字都是倒着的"——WebGL 纹理原点左下 vs PNG 左上，`UNPACK_FLIP_Y_WEBGL` 仅对 uTexBel 翻转（bg.jpg 抽象金属翻转无感，不动）；③ 拖尾保留时间缩短 1/3（追踪 lerp 0.45→0.675）+ 尾径/尾亮度沿拖尾渐缩到 0（`1.0 - i/49.0`，不再恒定）；④ 边缘模糊加重（blurTex 半径 4.4→7.0）；⑤ 蓝色色变加回（`rim = glow(1-glow)×4` 边缘带混 `vec3(0.35,0.62,1.0)×(lumA+0.25)`，在模糊边缘呈现）；⑥ 光圈再缩 25%（`R 0.3975→0.2981`）+ 边缘形变加强（折射 0.08→0.13、波纹 0.03→0.05）+ 波浪形变（双频正弦 `sin(ang×3+t×1.1+i×1.7)×0.6 + sin(ang×7-t×0.7+i×2.3)×0.4`，伪随机时变非正圆）
20. **拖尾存续再降 + 锥形加强（20260910za）**：① "存续时间再减少 35%"——lerp 上限 1，时间常数 ∝1/α 降到头（0.675→0.8，~0.84×），余量由 glow 衰减补（0.996→0.9945，衰减率 ×1.36），合计 ~35%；② "直径缩小直到消失更明显"——尾径线性改**平方衰减** `R×taper²`（半程处直径 0.5R→0.25R，锥形立竿见影）
21. **封面回退（20260910zb，用户点名"回退到加 I BELIEVE 之前"）**：main.js 从 git 原版恢复（`git checkout -- main.js`，HEAD 即 believe 前状态——believe 工作前 main.js 从未改过）；`.hero-believe` DOM 元素 + CSS 全删；`.hero z-index: 0` 移除；`assets/believe.png` 删除（备份 `/tmp/believe_backup.png`；PIL 生成脚本见 §1 第 18/19 条，字体 `/tmp/Anton-Regular.ttf`、`/tmp/Montserrat-Var.ttf` 仍在）。fx-gl.js 不动（清晰度伽马 2.0 + 2.0× 放大是用户自己点名的，保留）。验证：封面 = 原版液态金属 + 原光晕（R 0.265/lerp 0.45/blur 4.4/无黑洞无文字）
22. **介绍文案更新**：`<main>` 两段 intro 合并替换为 "Hi, I'm Jaime （谷仲禹）, currently student at Zhejiang University and intern at Moonshot AI, chasing the belief that with enough curiosity and conviction, any idea can be brought to life."
23. **正文区发光圆圈光标（已全部回退，作废留档）**：进入正文（hero-gone）后 `body.hero-gone #site * { cursor: none }` 全隐藏原生箭头，`.cursor-glow`（30px 白环 + 蓝晕 `box-shadow 0 0 16px 4px rgba(125,180,224,0.75)` + 微光内填，fixed z-index 9999）JS lerp 0.22 跟随；**悬停可点元素（a/button/[role=button]/input/select/textarea/summary/label/[data-theme-toggle]/.c-btn/.icon-btn）时光标完全消失**（自定义圆圈 `.off` 隐藏，原生箭头也不恢复——用户明确"不是恢复原生箭头，而是完全消失"）；pointerType≠mouse 不启用。后续：尺寸 30→24px（-20%）；消失方式改**融合动画**——悬停可点元素时 `.merge` 类 `scale 1→3.5 + opacity→0`（独立 `scale` 属性，与 JS 写的 transform 位移分离，CSS transition 接管），发光圈放大溶进元素外光圈后消失。**再改（用户："感觉光标被盖住"）**：改为**变形融入**——悬停时圆形光标 morph 成包住目标元素的圆角发光框（JS 每帧 lerp 位置/宽高/圆角到元素 getBoundingClientRect + 8px pad，框即元素的外发光轮廓，不再淡出消失）。**该步被用户回退**（回退到 scale 放大淡出版）。**终版（用户定稿三态）**：① 普通区域 24px 圆圈跟随；② 贴上可点液态玻璃文本块边界（内外 28px 内，DOCK）——光标 morph 成包住元素的圆角框（**边界连接=光标是文本块一部分**，opacity 随贴近程度 1→0）；③ 深入文本块内部（距边 >28px）——光标淡出消失。JS 每帧 lerp 位置/宽高/圆角/透明度（0.25/0.3 系数）。**抖动/消失 bug 修复**：① 外侧 DOCK 边界透明度 0↔1 突变=眨眼 → 外侧贴近区恒亮，透明度全链连续；② 小按钮（min 边 <56px）中心透明度按公式只剩 ~0.14 像"消失" → 小元素不做"深入消失"恒亮；③ fan-card hover 位移 265px 致 hit-test 振荡 → 停靠滞回（DOCK+24px 缓冲区保持停靠）+ 框每帧 rAF 重读元素 rect 跟踪位移。**最终用户以"bug 有点多"全部回退**：CSS/DOM/JS 三处光标代码全删，恢复原生箭头
24. **上线 f354a07**（用户发话）：index/fx-gl/main/HANDOFF3/4 + assets（photo.jpg、两字体）拷进主库推送，Pages 验证全 200（fx-gl ?v=20260910x、main ?v=20260910zb、JAIME GU、Moonshot AI、anton woff2）
25. **深色球体调暗 50%（20260910y，本地未上线）**："深色模式下背后球体亮度太高"——shader 深色主题球体 alpha 统一 ×0.5（`uTheme` 三元门控，光晕/核/亮斑/雾化区按比例同步调暗；浅色不变）
26. **双主题再调暗（20260910z，本地未上线）**：① 深色在 ×0.5 基础上再 ×0.5（合计 ×0.25）；② 浅色"当前亮度降低50% 对比度降低40%"——alpha ×0.5 + bcol 经典对比度公式 `(c-0.5)×0.6+0.5`（`mix(bcol, adjusted, 1.0-uTheme)` 仅浅色生效）
27. **整幅右区高斯模糊 + 球体尺寸补偿（20260910za，本地未上线）**："右侧球体加更大的高斯模糊，不只是球体，整个右边全部画面"——fx-gl.js 改 **FBO 三 pass 管线**：① 场景 → 离屏纹理 A；② 水平 9-tap 高斯 A→B；③ 垂直高斯 + 分区合成 → 屏幕（左区取 A 清晰源，右区取模糊，smoothstep(uSbw±40) 边界递增）。核：二项式权重 [1,8,28,56,70,56,28,8,1]/256，步长 10 CSS px，有效 σ≈14px。两 program 统一 `bindAttribLocation(p, 0, 'aPos')`；uniform 设置前 `useProgram`；resize 重建 FBO。球体补偿：右区评估半径 `r/0.88`（模糊糊大 ~12% 回压，左区 r/2.0 不变）
28. **右区球体边缘虚化（20260910zb，本地未上线）**："把右侧部分的球体边缘虚化"——haloShapeBlur 宽度 1.2→0.9（用户新指令覆盖，峰值 0.85 不动）：尾部更宽更平，球体轮廓彻底融入背景无剪影
29. **Projects 上移 + 扇形卡滚动展开动画（本地未上线）**：① Projects 区块（标题+四卡）整体上移到自我介绍与 Works 之间（新顺序：intro→Projects→Works→Blog→Contact）；② 滚动展开动画（用户点名"开始叠在一起，随下滑慢慢展开变成现在的样子"）：四卡 transform 改 `calc(±265/±90px × var(--p))` 位移 + `calc(基础° ± 增量° × var(--p))` 旋转（--p 0=中心叠放仅 ±1-3° 微散、1=现状扇形，hover 规则同步带 var）；JS 按 fan 顶边位置（视口 88%→43%）写 `--p`，平滑全走卡上既有 transition 0.4s。hover 位移元素滚动驱动用 CSS 变量插值比 JS 每帧写 transform 干净。**随即被用户纠偏"不是一瞬间展开，不滑动就不展开"**：去掉卡上 transform 的 CSS transition（时间驱动元凶），进度改 JS 每帧 0.18 lerp 与滚动 1:1 绑定（停止滚动立即停止，仅轻微缓动）。**再纠偏"还是自动展开，要随滑动/左栏收起同步展开"**：驱动源最终改为 **侧栏收拢的同一插值 `pe`**（`applyInner` 里 `pe = 1 - curW/(vw×0.65)`，fan `--p = pe`）——与 collapseP（滚轮累计 700px、可逆）严格同步，复用侧栏 tick 的 0.12 lerp 平滑，scroll 回上时同步收拢回叠

## 2. 当前实现结构（要点）

- **fx-gl.js**（单全屏 fragment shader）：
  - `fieldColor`：对角渐变，周期 0.15× 视口（任何相位下只见渐变切片，丝滑无带）；浅色 #d2e4f4/#a9d1ef/#dbe9f6/#afd2ef/#c2ddf3，深色 #1f2a33 系；42s 漂移
  - **6 球**（POS 数组 = CSS b1/b2/b4/b6/b8/b9）：v2 柔亮斑 + 饱和核 + 7 停光晕 + 浮动 squash 关键帧（与 CSS 一致）
  - 球缘折射：`nrm × g × 13px` 位移背景采样（液态透镜，从 26 减半）
  - **uSbw 分区**：`blurZone = smoothstep(uSbw-40, uSbw+40, css.x)`；清晰层 `haloShape`（7 停），雾化 `haloShapeBlur = exp(-(r×1.7)²)×0.85`（r 到 1.8）
  - **右区双模糊 + 饱和补偿**：模糊区球体走 7×3 各向异性高斯拖影核（沿浮动速度，`spd×8.3` 封顶 `size×0.13`——用户把形变砍到 1/3）；`bcol` luma 外推 1.85 + 超色域整体归一；雾化 alpha ×1.12；剔除半径 2.5
  - 接缝遮罩：`clamp((css.y+uScroll)/480, 0, 1)` 混 `uBg`（与 `.fx-bg` 的 mask-image 逐字一致）
  - 主题：MutationObserver 切 LIGHT/DARK 调色板；`body.hero-gone` 才渲染（hero 阶段省 GPU）；DPR cap 2；`uDpr` 换算设备 px
- **index.html**：`<canvas id="fx-gl">` + `body.gl-ok` 隐藏 `.fx-bg/.fx-bubbles` + `<script src="fx-gl.js?v=20260910p">`
- **侧栏玻璃**（CSS，两版共用）：`saturate(1.7)` 全透明 + 四边均匀边缘光（1.2px 描边 + 软光晕 + 顶光 `inset 0 2px 4px` + 底影 `inset 0 -3px 8px` + 右缘连续微发光 `inset -2px 0 6px` + `inset -8px 0 20px`）+ `::after` 115° 光泽亮带（0.5 峰 + 太阳高光点）+ 顶部天空光
- **CSS 双层背景**（`.fx-bg` / `.fx-bubbles` ×2）：回退兜底，b3/b5/b7 已同步删除（现 b1/b2/b4/b6/b8/b9）

## 3. 用户偏好（本对话新增/确认，与 HANDOFF3 合并有效）

- **对"缓存旧版"零容忍**：迭代后必须立刻看到最新版——8980 已换 `serve_nocache.py`（no-store），JS 子资源带 `?v=` 双保险；**每轮迭代后附上本地链接**（http://localhost:8980/）
- **验收标准极高，放大看细节**："你自己看看这清晰吗？你的验收标准过低"——改完必须自己截图放大验收，**必须含 DPR2 环境**（DSF1 无头测不出 DPR 类 bug）
- **效果方向具体可感**："丝滑渐变"（看不到过渡边界）、"油画晕染"、"水润光泽"、"左右强对比（左清晰右模糊）"——会逐条验收；方向不对立刻否（"丑的快死了"、"什么鬼"）
- **不要降级视觉效果**：修性能/修 bug 不许砍效果（saturate 1.7 经 A/B 验证显著，不可砍）
- **对波纹/云朵/雷霆大波浪极敏感**：任何可见场纹在大窗口下都聚成"云朵"被判丑——渐变要"丝滑"（周期拉到视口外，0.15×）
- **对球体密度敏感**：叠放太多会被点名删球（b3/b5/b7 已被删；删球要 fx-gl.js 和 CSS 双层同步删）
- **对"加色块实现模糊"反感**："模糊效果不能通过增加色块实现"——雾团要低峰宽尾高斯，不要实心色块、不要轮廓环（rim 环/幽灵边缘被否过）
- **回滚指令要听清范围**："这一轮整体回滚"可能指一小轮——回滚前先确认哪一轮、含哪些文件
- **实验在备份目录做，只改本地**；上线必须他明确说（cb90eb1 是他发话上线的）

## 4. 经验教训（血泪，按重要性排序）

1. **无头 Chrome 加 `--disable-gpu` 会彻底关掉 WebGL**：`getContext('webgl')` 返回 null → 页面静默回退 CSS 兜底层——截图"看着正常"但根本不是 shader 画面，改动的 shader 全白测。**无头测 shader 不要加 `--disable-gpu`**（不加时 headless 走 SwANGLE 软件 WebGL 正常）；验证方法：`--dump-dom | grep '<body'` 必须带 `gl-ok` class
2. **像素测量会被 emoji/文字污染**：页面里的 👋🌊🚀 emoji 和彩色标题文字饱和度极高，`sat_max` 全测在 emoji 上——取样框必须避开文字/图标区，或在隐藏 `<main>` 的原始画面上测（`sed 's/<main>/<main style="visibility:hidden">/'`）
3. **饱和度外推超色域时，整体归一 ≠ clamp**：`clamp` 逐通道截断会改色相（紫→品红）；`boosted /= max(rgb)` 保色相降明度，观感饱和度更高且无色偏
4. **拖影/形变强度先按"勉强可见"给**：`spd×25`（≈球径 20%）被用户判"形变幅度过大"砍到 1/3（`spd×8.3`，≈球径 7%）——新视觉效果首版宁弱勿强，用户会放大看；垂直方向扩散要固定小值，随 trail 等比放大会洗掉方向性
5. **拖影核归一化会降峰值**：核越长峰越低（能量摊薄），需配合 alpha 略增（+12%）补回色彩存在——但别补成实心色块（用户大忌）
6. **行进式渐变漂移 = 波浪带**：fieldColor 用 `t/42` 线性漂移会让色停边界轮番扫过视口（"蓝白交替波浪带"）——漂移必须原地呼吸（sin 小振幅），且视口切片要落在单个色停过渡内
6. **`gl_FragCoord` 是设备 px，必须除 `uDpr`**：DSF1 无头截图全对，Retina DPR2 真窗口全错位——shader 验收必须含 DPR2 环境（真实窗口、 `--force-device-scale-factor=2` 无头截图，或 `Emulation.setDeviceMetricsOverride deviceScaleFactor:2`）
7. **`smoothstep` 边界必须严格递增**：`smoothstep(0,0,x)` 除零产生 NaN 会把整场洗白——运行时边界用 `max(edge1, edge0 + 0.001)` 钳制；NaN bug 在无头 scrollY=0 环境不出现，只有真实路径能踩到
8. **`scrollTop = N` 赋值也被 `scroll-behavior: smooth` 劫持**：不只 `window.scrollTo`——进入正文后 scrollY 落在 ~72 而非视口高（finishEnter 的 offset 因此 ~0）。任何"当前滚动位置"假设都要实测，不要按赋值推算
9. **视觉问题先拆层定位**：球（径向取样）→ 场（无球区取样）→ 遮罩（边界取样）——用户的"白云"是场波纹 + 接缝，不是球；球径向曲线与 CSS 完全一致
10. **替换实现先逐字读被替换件源码**：接缝遮罩初版按记忆重造（120px smoothstep 混纯白），和 CSS 的"文档顶 480px 线性 mask"完全不同——被替换件（`.fx-bg` 的 mask-image）要逐字对齐
11. **渐变带要"丝滑"就把周期拉到视口外**：0.5/0.707/0.333 带宽都会被判"雷霆大波浪"——直接 0.15×，视口内永远只见渐变切片
12. **rim 环/幽灵边缘必死**：模糊区球体用 rim 环做"幽灵边缘"，深色收拢态变甜甜圈——要柔和云团（填充式低 alpha），不要轮廓环
13. **模糊不能靠加色块/褪色实现**："模糊效果不能通过增加色块实现"——雾团要低峰宽尾高斯（**1.2/0.85 是当前平衡点（1.7→1.2 是用户新指令），别再动 haloShapeBlur 的宽度/峰值**），不要实心色块、不要轮廓线、不要褪色
14. **玻璃水光只走 CSS 表面光泽**：canvas 焦散亮丝（脊状噪声）被判"丑的快死了"——光泽亮带/太阳高光点/顶光走 CSS，**不要在 canvas 里加任何噪声纹理**
15. **新增 JS 子资源必须带版本号**：fx-gl.js 首版无 `?v=`，用户浏览器缓存旧版，把已修复的 bug 当现状反馈了一整轮——`<script src>` 一律 `?v=日期+字母`，每次改动 bump
16. **回滚前先确认范围**：用户说"整体回滚"时可能指一小轮——回滚类指令先把"哪一轮、含哪些文件"问清或列出再动手；删除前一律先 cp 到 /tmp
17. **无头 60Hz ≠ 真实 120Hz ProMotion**：偶发问题（闪烁/卡帧）只有真实窗口/真实刷新率能测——CDP rig（`/tmp/flicker_rig.mjs` + `/tmp/flicker_diff.py`）备用；有头窗口被遮挡会暂停 rAF（macOS 遮挡节流），测量前 `Page.bringToFront` 并加 >1s 失速检测剔除污染轮

## 5. 待办（用户点名，按优先级）

1. ~~右侧部分饱和度提高 + 动感模糊 + 高斯模糊~~ **已完成（v20260910r，见 §1 第 8 条）**；用户验收后四连反馈已修（v20260910s，见 §1 第 9 条）——等用户再次验收
2. **（用户发话才做）上线**：当前 fx-gl.js v20260910u 纯本地实验，用户说"上线"才推 GitHub（流程见 §6）

## 6. 快速上手

```bash
cd "/Users/user/Kimi Code/portfolio-hero-backup-20260910"
python3 serve_nocache.py 8980   # 禁缓存预览（如被占用先 lsof -nP -iTCP:8980 -sTCP:LISTEN 查）
# 无头验证（无浏览器时）——千万别加 --disable-gpu（会关掉 WebGL，静默回退 CSS 兜底，shader 白测；教训 1）：
sed -e 's/<body>/<body class="hero-gone">/' -e 's/<section class="hero">/<section class="hero" style="display:none">/' index.html > _test.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars --window-size=1600,1000 --virtual-time-budget=4000 --screenshot=/tmp/x.png "http://localhost:8980/_test.html"
#   验证 WebGL 路径生效：--dump-dom 的 <body> 必须带 gl-ok class；看 shader 原始画面再加 -e 's/<main>/<main style="visibility:hidden">/'
# DPR2 验收（必须）：上面命令加 --force-device-scale-factor=2 即可
# 真实环境验收（更高保真）：
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 about:blank &
#   然后 CDP Emulation.setDeviceMetricsOverride {width:1915, height:867, deviceScaleFactor:2} 再截图
# 交互/性能验证：kimi-webbridge（session portfolio-rebuild，测前 Page.bringToFront）；
#   扩展断开时用 --user-data-dir=/tmp/chrome-debug-profile --remote-debugging-port=9334 有头实例 + Node24 原生 WebSocket CDP
# 上线（用户明确说"上线"才执行）：
cp index.html fx-gl.js HANDOFF3.md HANDOFF4.md ../portfolio-hero/ && cp -R assets ../portfolio-hero/ && cd ../portfolio-hero && git add -A && git -c user.name="Jaime-Gu" -c user.email="jaime-gu@users.noreply.github.com" commit -m "..." && git push
# Pages 约 1 分钟生效，验证：curl -s https://jaime-gu.github.io/portfolio-hero/ | grep "特征字符串"
```

**禁止**：提交 git、推 GitHub（用户没说"上线"前）、动主项目 `portfolio-hero/`、引入任何 SVG url() 滤镜/SMIL/整屏 backdrop 模糊层、在 canvas 里加噪声纹理（焦散亮丝已被否决）、动 haloShapeBlur 的宽度/峰值（1.2/0.85 是用户认可的平衡点（1.7→1.2 已被用户新指令覆盖），除非用户新指令覆盖）。
