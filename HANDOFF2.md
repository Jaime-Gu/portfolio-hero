# 交接文档 — 个人主页项目（portfolio-hero）

> 写给下一位接手的 agent。本文档记录截至目前的全部工作、用户偏好、技术细节与经验教训。
> 上一版交接文档中的早期历史（首屏 WebGL 封面、jaime-page 合并、强分割切换、暗夜玻璃初版）仍然有效，本文档在其基础上更新。

## 1. 项目概况

用户在做一个**个人主页**（兼作简历和作品集）。已完成：首屏 WebGL 动感封面、双主题（深/浅）正文框架、左侧个人信息栏（占位内容）、mistral 同款分割线滚动平移交互（已升级为阶段式收拢）、**kail.studio 风格正文重构（占位内容）**、液态玻璃配方（三件套定稿）。左栏照片/简介与正文文案仍是占位，等待用户提供真实内容。

- 项目目录：`/Users/user/Kimi Code/portfolio-hero/`
- GitHub 仓库：https://github.com/Jaime-Gu/portfolio-hero （public，用户 GitHub 用户名 `Jaime-Gu`）
- 线上地址（GitHub Pages）：https://jaime-gu.github.io/portfolio-hero/
- 本地预览：`cd portfolio-hero && python3 -m http.server 8931` → http://localhost:8931
  - **必须走 http 服务**，file:// 打开时 Chrome 会拦截 WebGL 纹理加载
- **部署状态**：线上已部署到 `d25f523`（2026-09-10，含阴影缩 1/3、About Myself 换 Bebas Neue+翻转、阶段式收拢、hover 去深色描边、气泡→彩色模糊团、Friends→Contact 分栏玻璃面板、扇形卡迁入 Projects 并放大调平间距）。工作区有**未提交改动**（左栏苹果级液态玻璃，待办 3）——下一轮用户说"上线"时先推这批

## 2. 文件结构

```
portfolio-hero/
├── index.html      # 单文件页面：首屏 hero + 正文（#site），全部内联 CSS/JS
├── main.js         # 首屏 WebGL 效果（原生 WebGL，无依赖）
├── assets/bg.jpg   # 封面底图 2560×1440（用户提供的水纹玻璃照片裁切而来）
└── .git/
```

外部依赖：Google Fonts 的 **Bebas Neue**（index.html head 里 `<link>` 引入，用于左栏 About Myself 竖排大字）。其余全部为系统字体栈，无其他依赖。

另有参考源文件 `/Users/user/Kimi Code/jaime-page/index.html`（正文页原始模板，正文曾从这里合并，现已全部删除待重构）。

## 3. 当前状态（详细）

### 3.1 首屏封面（main.js + index.html hero）

- WebGL 效果与上一版一致：50 节点彗星拖尾光晕、折射+色散、背景高斯模糊+动感模糊、暖色块保持清晰饱和、冷灰区虚化降饱和
- 调试参数：`?mx=0.6&my=0.45&g=0.9` 固定光晕；`?tx/ty` 模拟拖尾；`?vx/vy` 模拟动感模糊
- **新增**：`main.js:99-103` 有一段"蓝色降饱和 40%"代码（cool mask 把冷色像素 b 通道向 r 靠 40%）。实测**视觉不可见**（原图蓝色信号极弱，b-r 峰值仅 36/255），保留无害，可删
- **新增**：帧循环开头有 `if (canvas.offsetParent === null) return;`——封面被 `display:none` 后 WebGL 循环自动停止
- 封面底部过渡带：深色 130px 灰渐变（`#6e6e6c` 末端）；浅色 65px 浅蓝渐变（`#dce9f4` 末端，55% 处半透明 0.35）
- SCROLL 提示在封面底部居中，`z-index: 1` 压过渐变带

### 3.2 双主题体系（index.html 内联 CSS）

- `[data-theme="dark"]`：暗夜玻璃——底色 `#1b1b1a`、文字暖白 `#ece7df`、琥珀 `#e8a33d`、冰蓝 `#7db4e0`、蓝灰液态玻璃卡片
- `[data-theme="light"]`：白底 + 蓝色系——底色 `#ffffff`、文字 `#2b2519`、主蓝 `#3a7fae`、辅蓝 `#7db4e0`、白玻璃卡片（`rgba(255,255,255,0.55)` + 暖蓝细描边）、标题/头像渐变 `#5fa8dc→#3a7fae`
- **切换**：`localStorage('theme')` 优先，首次访问跟随 `prefers-color-scheme`。左下角圆形悬浮按钮（`.theme-fab`），仅在正文区显示（`body.in-site` 时淡入）
- 注意：曾有一版"暖橙"浅色主题（蜜桃过渡 `#f0cdb6`、橙渐变 `#e37b35→#cc5526`），被否后改蓝色。橙色版备份在 `/tmp/index_orange_backup.html`

### 3.3 左栏（sidebar）——mistral 同款交互

- **宽度驱动**（index.html 底部脚本）：`collapseP`（0→1，滚轮累计驱动，见 3.4）→ 左栏宽度 `65vw*(1-collapseP)`，从 65vw（从右往左 35%）收拢到 0。rAF 插值 0.12 平滑跟随。首次对齐直接到位不播动画（`curW=null` 模式，防进入时跳一下）。仅桌面端（`min-width: 1024px`）
- **背景（2026-09-10 升级为苹果级液态玻璃，待办 3 完成）**：不再是纯色，改为 `.side-glass` 层（absolute inset 0，pointer-events none）：`backdrop-filter: url(#lg-refract) blur(26px) saturate(1.7)`（**url() 前有纯 blur 兜底行**，url 无效时自动回退）；`#lg-refract` 是内联 SVG 滤镜（`feTurbulence` 噪波 + `feDisplacementMap` scale 40 位移折射背景，SMIL 22s 缓慢流动 = 液态感），定义在 #site 开头。基底薄染压低 alpha 让彩团透出（浅：白 0.22/冰蓝 0.08；深：蓝灰 0.13/暖灰 0.06）。**边缘弧度+折射带**：侧栏 `border-radius: 0 28px 28px 0` + `::before` 外圈 22px 环带（mask content-box exclude 挖出）二次折射 + inset 高光描边（浅 0.75/深 0.45 白）+ `::after` 斜向流光 16s 漂移（深色 opacity 0.35）。外侧投影 `16px 0 48px`。原琥珀/橙色 border-right 已随纯色背景一并移除（被玻璃高光描边取代）。`.side-inner` 加 `z-index: 1` 压在玻璃层上，文字不受折射影响。实测 Chrome 支持 `backdrop-filter: url()`（红圆边缘扭曲验证），满幅玻璃 121fps
- **内容升起消失**：`.side-inner` 随同一插值进度 `translateY(-55vh)` + `opacity` 淡出，sidebar `overflow: hidden` 裁切——mistral 同款挤压退场
- **内容布局**（Henri 编辑排版风，全部占位）：
  - `.side-name`「JAIME」：`clamp(7rem, 11vw, 13rem)`、weight 900、`letter-spacing: 0.16em`（2026-09-10 用户要求：从 -0.08em 压缩改为 +0.16em 撑开，"间距扩大一倍"——注意是撑开不是收紧，曾误判为 -0.16em 被纠正）、top 0（从 1vh 上移，缩小顶部间距）、left -0.03em（顶住左缘微出血）
  - `.side-photo`：3:4 竖图占位（渐变 + PHOTO 标），top 20vh、left 1.6%（从 4% 缩到 40%）、width 42%
  - `.side-title`「CREATIVE DEVELOPER」：`writing-mode: vertical-lr`（朝左竖排）、Arial Narrow 窄体、0.75rem、letter-spacing 0.3em、`color: var(--fg)`（与右缘竖排同款，2026-09-10 从 fg-dim 改）、紧贴照片右缘（`left: calc(43.6% + 0.4rem)`，随照片左移重算）
  - `.side-bio`：简介小字块，left 4%、bottom 5vh、width 62%
  - `.side-vertical`「About Myself」：`writing-mode: vertical-rl` + `transform: translateY(-50%) rotate(180deg)`（2026-09-10 翻转朝向，与 CREATIVE DEVELOPER 的 top→bottom 镜像，读作 bottom→top）、**Bebas Neue**（Google Fonts 免费字体，扁粗厚重，head 里引入；weight 只有 400 靠字形本身显厚）、`clamp(2rem, 5.5vh, 2.75rem)`、letter-spacing 0.15em、`color: var(--fg)`、顶住面板右缘

### 3.4 滚动机制（重要，历经多轮修复）

- **封面→正文**：滚轮累计 >260px 触发 `goTo(t)`（power4.inOut 曲线 1.5s 整屏切换）
- **正文顶即页面顶（终极方案）**：进入正文后执行 `finishEnter()`——封面 `display:none` 移出文档流，滚动位置按偏移量无缝换算（`offset = scrollY - t`）。此后页面顶就是正文顶，**物理上无法回滚**，根除所有抽搐/回弹
- **阶段式左栏收拢（2026-09-10，替代原滚动进度驱动）**：`collapseP`（0→1）由**滚轮累计**驱动（`COLLAPSE_WHEEL = 700`px 滚完全程）。阶段1（收拢中）：wheel 下滚 `preventDefault` **页面钉住不动**——右栏只换行不下滑（用户明确要这个：之前换行+下滑同时进行很影响阅读）；`collapseP = 1` 后放行页面滚动。阶段1回退：页面顶 wheel 上滑 → collapseP 递减重新展开；collapseP = 0 时上滑仍拦截（回不到封面）。键盘 ArrowDown/Space/PageDown 在阶段1 按 0.25 步进收拢，ArrowUp/PageUp 回退。宽度仍走 rAF lerp 0.12 平滑（tick 不变），`measure()` 改为 `targetW = 0.65vw × (1 - collapseP)`
- **辅助防线**：`html, body { overscroll-behavior: none; }`（消除 macOS 橡胶回弹白条）；滚轮/键盘/触摸上滑提前拦截 + 过冲预判（`y+dy<t` 时提前落顶）
- **fab 显示**：`body.in-site` 类控制（heroGone 或 scrollY>0 时 true）

### 3.5 正文（main）——kail.studio 风格重构（2026-09-10 完成）

- **结构**：简介（hero-title + intro）→ Works（2 组公司卡）→ Projects（扇形散卡）→ Blog（横滚卡片流）→ Contact（分栏玻璃面板）→ footer。全部占位文案，复用删除前的旧文案并补充
- **背景特效层**（#site 前两个子元素，均 z-index 0）：
  - `.fx-bg` 流动渐变场（absolute inset 0，顶部 480px 接缝区 mask 遮蔽）：`inset: -25%` 超大内层 + `translate3d` 关键帧漂移 42s（合成层动画，零重排）。浅色为浅蓝系渐变，深色为深灰蓝系
  - `.fx-bubbles` 气泡层（**position: fixed 固定视口，不随滚动移动**，2026-09-10 用户要求从滚动层移出）：`opacity: 0`，`body.hero-gone` 时淡入 0.6s（hero 阶段不可见；hero-gone 类在 finishEnter 里添加）。**已改为彩色模糊团**（2026-09-10，用户要"以颜色变化为主，不需要清晰的圆圈"）：去掉白描边和 inset 阴影（清晰感来源），每团独立径向渐变配色（蓝/丁香紫为主，b5 一点暖橙点缀），`filter: blur()` 随尺寸缩放 32–64px，元素 opacity 浅 0.8 / 深 0.7（深色首版 0.5 太淡不可见，已提高；深色渐变 alpha 0.6–0.8）。尺寸布点不变（420/300/210/350/175/140px 按视口百分比；b4/b6 在左侧区域，侧栏收拢后显露）。上浮呼吸动画不变
- **液态玻璃三件套**（2026-09-10 升级，覆盖 `.card/.post/.work-logo/.blog-card/.fan-card` + 按钮 `.go` + 切换按钮 `.theme-fab`）：亮描边 `rgba(255,255,255,0.7)`、顶部内高光（深色 0.5 / 浅色 0.95）、**低透明度软阴影**（深色 `rgba(0,0,0,0.20)+rgba(123,180,224,0.06)`、浅色 `rgba(58,127,174,0.10)`；用户第一版要求写"暖橙色"后删去，按最新版执行为冷色系低透明度；**阴影模糊半径已缩到 1/3**：主阴影 28→9px、辉光 32→11px、hover 36→12px、扇形 hover 48→16px）。`backdrop-filter: blur(24px) saturate(1.4)`（两主题统一）。**玻璃背景 alpha 刻意压低保证通透**（深色 `rgba(150,175,205,0.28)` + 白渐变 0.10/0.03；浅色 `rgba(255,255,255,0.22)` + 白渐变 0.50/0.15）——要隐隐透出背后的气泡/渐变场，太实会像白板（用户明确指出"要能看到蓝色圆球"；曾按"透明度+20%"加到 0.36/0.66 被否，回收到更低）。圆角卡片统一 20px（`.card/.post/.blog-card` 从 0.75rem 加大；`.fan-card` 原本就是 20px）。**hover 不改描边**（曾把描边改成深色彩边，视觉上边缘内收像"变小"，2026-09-10 用户指出后去掉）——只 translateY(-3px) 微抬 + 低透明度冷色微发光，扇形卡 hover 同
- **Blog 横滚卡片流 `.blog-stream`**：`overflow-x: auto` + `scroll-snap-type: x mandatory` + 隐藏滚动条；卡 `flex: 0 0 250px`。负 margin 出血（`margin: 0 -1.5rem` + `padding: 6px 1.5rem 14px`）让流贴 main 边缘、卡 1 对齐正文。**必须配 `scroll-padding-left: 1.5rem`**，否则 scroll-snap 把卡 1 吸到容器左缘（scrollLeft 停在 24），出血失效卡 1 贴屏幕边
- **Projects 扇形散卡 `.fan`**（2026-09-10 从 Friends 迁入，取代原 4 卡 grid；同日应用户要求放大）：4 卡 absolute（left 50% + margin-left -142.5px，卡 285×365px），`transform-origin: 50% 100%`，水平位移 ±90/±265 + 微旋转 ±2.5/±7.5°，重叠约 1/3，**总跨度 ~908px ≈ blog 流宽 900px**（用户要求与 blog 及分栏线同宽；首版 210×270/±70/±210 太窄被否）。`.fan` 高 397px：卡锚定容器底，容器高度只影响上间距（下间距由 margin 栈决定，恒为外卡 47/内卡 60），397px 时上下同宽（外卡 47/47、内卡 56/60；首版 430px 上宽下窄被用户指出）。hover 逐卡规则：保留各自 translateX 原位提起（rotate→0 + translateY(-28px) + scale 1.05 + z-index 10）。深色下扇形卡单独压暗（白渐变 0.06/0.015 + 蓝灰 0.15，防叠加累积增亮）。移动端 `.fan` scale(0.44) height 190px。卡内容即原 4 个项目（tiny-render 🖥 / weekend-os ⌨️ / photo-log 📷 / dotfiles ⚙️，f-emoji 4rem 圆形渐变底 + h3 1.2rem + p 0.88rem），链接占位
- **关键修复 `main { min-width: 0 }`**：blog 横滚流的 min-content（5×250px 卡）把 main 的自动最小尺寸顶到 max-width 900px，flex 收缩失效 → 整页横向溢出 371px。加 min-width: 0 后 main 收缩到剩余空间，blog 流内部滚动
- 旧 CSS（`.post/.work-group/.card-grid` 等）保留复用；`.post` 目前未被 markup 使用（blog 改用 `.blog-card`），样式留在玻璃选择器组里无害

### 3.6 验证方式更新

- **kimi-webbridge 真实浏览器验证**（本轮主力）：navigate 开标签 → `cdp Page.bringToFront` → evaluate（scrollTo 触发 finishEnter 进正文、量尺寸、改主题）→ screenshot。session 名 `portfolio-rebuild`，标签组「portfolio 正文重构」
- 模拟 hover：`cdp Input.dispatchMouseEvent {type:"mouseMoved", x, y}`（视口坐标，先 evaluate 取元素中心）
- 移动端验证：`cdp Emulation.setDeviceMetricsOverride {width:390,height:844,deviceScaleFactor:2,mobile:true}`，用完 `Emulation.clearDeviceMetricsOverride`
- scrollIntoView 会同时滚两个轴，可能干扰 scroll-snap 容器的 scrollLeft，测量前先归零

## 4. 用户偏好（重要）

- **审美**：喜欢 henriheymans.com 的丝滑克制（"惊艳但不炸眼"）；排版上喜欢 Henri 的编辑风——无衬线加黑加粗、大字顶住画面边缘、横竖字结合、大面积留白、艺术感 profile 照片。交互上喜欢 mistral.ai 的面板挤压滚动
- **字体品味**：扁粗厚重的编辑字体（Bebas Neue 这类窄体重字）；竖排文字的朝向（朝左/朝右镜像）、字号层级（"比 JAIME 小两个号"）都有具体想法
- **色彩敏感**：配色必须**从实际渲染结果取样**（截图取色），不能从原始素材取（shader 有调色/暗角，差异很大）
- **视觉错觉敏感**：会注意到"卡片变小了"这类细微感知问题，要求查根因不敷衍（案例：hover 描边变深色 → 边缘内收错觉，修掉描边变色即解）
- **参考图驱动**：给参考图时要照其结构做、按说明取舍（"像 m3 一样散开，但不要底座"——结构照做，指明不要的部分别加）
- **以最新一条消息为准**：他会修正自己的需求（第一版写"暖橙色"，重发时删去）——前后不一致时按最新版执行，被否的方案在文档里记一笔避免重蹈
- **工作节奏**：小步快跑，每步都要看到效果再迭代；参数调整喜欢精确量化（"扩大 20%"、"降低一半"、"间距缩到 40%"）；喜欢给多个候选方案让他挑
- **对滚动卡顿/抽搐零容忍**：要"完全拉不动"的绝对稳定，不接受任何回弹、过冲、振荡
- **交互节奏敏感**：不止卡顿，连"左栏收窄时右栏换行+下滑同时进行影响阅读"这种节奏问题也会指出——滚动编排要分阶段（先收拢钉住，再放行滚动）
- **上线习惯**：明确说"上线"才推 GitHub；说"本地做草稿"就绝不推
- **占位先行**：喜欢先用占位图/占位文字把交互和排版做出来，真实内容后给
- 语言：中文交流

## 5. 经验教训（踩过的坑）

1. **无头 Chrome 截图的缓存**：子资源（main.js）会被正在运行的 Chrome 进程缓存（无头截图复用用户 Chrome 进程）。每次改完 JS 截图必须**换新端口**（新 origin 空缓存）。`--user-data-dir` 首启会卡住，别用
2. **无头截图确定性**：`--virtual-time-budget` 让两次截图逐字节一致（时间驱动的颗粒/波纹都一样）——适合做像素差分验证
3. **整页截图**：`.hero` 有 `height: 100vh` + `height: 100svh` 两行，临时改高度截图时**两行都要改**，且 `.sidebar` 的 `height/min-height: 100vh` 也会被误伤，截完必须逐一恢复（用 Python replace 精确还原）
4. **kimi-webbridge**：后台标签页 rAF 和 scroll 事件都被节流——测量前必须 `cdp Page.bringToFront`。用户会随手关标签页，session 报 "No tab with given id" 时重新 navigate 即可。合成 WheelEvent 不会产生真实滚动，但能触发 wheel 监听器——验证拦截逻辑用 `new WheelEvent("wheel",{deltaY:N,cancelable:true})` + 检查 `defaultPrevented`。**`cdp Input.dispatchMouseEvent` 传 `type:"mouseWheel"` 会让守护进程挂起（调用无响应，且事件可能已发出导致状态污染），别用**
5. **滚动钳制必败**：任何"滚动后归位"的方案在惯性 fling 面前都会振荡（fling 不触发可拦截的 wheel 事件）。唯一可靠解是**移除可滚空间**（封面 `display:none`）
6. **图片蓝色信号**：本项目封面图蓝色极弱（b-r 峰值 36/255，仅 7.1% 像素偏蓝）——"蓝色降饱和"类调整注定不可见。用户感知的"蓝灰"是近中性灰，要降的是色偏不是饱和度
7. **接缝对齐**：封面正文过渡色必须两边相等；透明度只加在渐变主体，接缝处保持不透明
8. **批量加 #site 前缀的遗留 bug**：`#site [data-theme="light"] .icon-sun` 这类选择器永远不匹配（data-theme 在 html 上），旧图标显隐规则是死代码，已修复为无 #site 前缀
9. **GitHub 凭据**：本机钥匙串存着 `Jaime-Gu` 的 token（`git credential fill` 可取），推送走 HTTPS
10. **未提交改动备份**：一律 `cp` 到 /tmp，绝不用 `git checkout` 恢复
11. **flex 子项的横向溢出**：flex 容器里任何"内容很宽"的子项（如横向卡片流）会把自动最小尺寸（min-width:auto=min-content）顶满，flex-shrink 失效 → 整页横向溢出。标准修法：给该 flex 子项 `min-width: 0`。诊断姿势：`document.documentElement.scrollWidth > innerWidth` 即溢出，逐个隐藏子元素定位罪魁
12. **scroll-snap 与负 margin 出血冲突**：scroll 容器用负 margin + 等量 padding 做"内容出血、首项对齐"时，scroll-snap 会把首项吸到容器（padding box）左缘，padding 失效。必须加等量 `scroll-padding-left`
13. **叠放玻璃卡累积增亮**：N 张 backdrop-filter 玻璃卡叠同一位置，每层 tint 不透明度累加，N 层后显著变亮（深色主题下 5 层 0.30 蓝灰 → 亮蓝灰）。叠放场景每层不透明度要减半
14. **同一 CSS 规则内重复属性后者胜**：`.sidebar { display: none; ... display: flex; }` —— 临时插属性调试时若插在规则开头，会被后面的同名属性静默覆盖，表现为"改了没效果"，极易误判为缓存。插入位置要在规则末尾，或先 grep 该规则是否已有同名属性
15. **hover 改描边颜色会造"变小"错觉**：hover 时把描边从亮色改成深色彩边，视觉上边缘内收、元素像变小了（实际是错觉，尺寸没变）。hover 反馈要保持描边一致，只用位移+辉光
16. **玻璃透明度是双向的**：太实（alpha 高）像白板、看不到背景气泡；太透（alpha 低）失去玻璃质感。验证过的平衡点（气泡隐约透出）：浅色 `rgba(255,255,255,0.22)` + 白渐变 0.50/0.15；深色 `rgba(150,175,205,0.28)` + 白渐变 0.10/0.03。历经"透明度+20%"（太实被否）和"要能看到圆球"（回收）两轮后定稿，别再往实里加
17. **webbridge evaluate 里滚动归零**：`window.scrollTo({top:0,behavior:"instant"})` 不可靠（`html { scroll-behavior: smooth }` 会把数值型 scrollTo 变成平滑滚动，中途还会被 synthetic wheel 打断卡死）。用 `document.scrollingElement.scrollTop = 0` 直接赋值，同步即时到位
18. **`backdrop-filter: url(#svg)` 折射可用但要验证+兜底**：Chrome 支持 backdrop-filter 引用内联 SVG 滤镜（feTurbulence+feDisplacementMap 做背景折射，SMIL animate baseFrequency 做液态流动）。注意三点：(a) 同一声明里 url() 若不被支持会整行作废——必须先写一行纯 blur 兜底再写 url 增强行；(b) getComputedStyle 只能证明语法被接受，是否真渲染要截图验证——用纯色圆（背景平滑时位移不可见）看边缘扭曲；(c) 折射位移只作用于背景，上层文字内容不受影响，文字层记得 z-index 压上去

## 6. 待办 / 下一步方向

> 第 1、2、3 项均已完成（2026-09-10）：Friends 扇形卡区改为 Contact 分栏玻璃面板、气泡改为彩色模糊团、**左栏升级为苹果级液态玻璃（url(#lg-refract) 位移折射 + 边缘环带 + 圆角高光 + 流光，与卡片配方完全不同）**。

### 长期事项（用户给素材/发话后推进）

- **左栏真实内容**：4:3 竖屏生活照（用户说"照片先不给你"）、两排大字内容、真实简介——替换占位
- **正文真实文案**：简介、Works/Projects 真实项目、Blog 真实文章、联系方式——目前是占位文案
- **AI 项目前端 demo 展示**：工作目录下有 `amsterdam-sim/`、`london-sim/`、`city-case*/`、`xingzai-*/`、`library-night-watch/`、`mini-tokyo-3d/` 等现成 Three.js 项目可接入。参考模式：Simon Willison 的 tools 子站
- **kail.studio 参考素材**：完整 CSS 已抓存 `/tmp/kail.css`（另 `/tmp/kail.html`、`/tmp/kail.js`），五项技法已拆解应用；未用的还有：无限跑马灯缎带（`.ptypes-banner-*`）、发际线渐变分隔线、同色辉光阴影手法、`cubic-bezier(.16,1,.3,1)` 全站统一缓动
- **上线**：用户没说"上线"前不推 GitHub。推送命令见第 7 节。注意工作区有一批未提交改动（见第 1 节部署状态），下次"上线"先推

## 7. 快速上手

```bash
cd "/Users/user/Kimi Code/portfolio-hero"
python3 -m http.server 8931   # 本地预览
# 改完后上线（用户明确说"上线"才执行）：
git add -A && git -c user.name="Jaime-Gu" -c user.email="jaime-gu@users.noreply.github.com" commit -m "..." && git push
# Pages 约 1 分钟生效，验证：
curl -s https://jaime-gu.github.io/portfolio-hero/ | grep "特征字符串"
```

**验证截图的标准姿势**：
- 无头截图：`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=4000 --screenshot=/tmp/x.png "http://localhost:PORT/"`
- 整页长图：先把 `.hero` 两行高度（100vh + 100svh）都临时改成 900px，用 1440×2900 视口截，**截完恢复**（含 `.sidebar` 的 100vh/min-height）
- 滚动交互验证：kimi-webbridge + `Page.bringToFront` + evaluate scrollTo（后台标签页 rAF/scroll 事件都被节流，别在后台测）
- 每次改 JS 后截图换一个新端口（8932、8933...）
