# 交接文档 3 — 液态玻璃实验（portfolio-hero-backup-20260910）

> 写给下一棒 agent。本文档记录「WWDC25 液态玻璃」实验分支的全部工作、教训与待办。
> 主项目交接文档见 `portfolio-hero/HANDOFF2.md`（主项目已部署到 `d351fa4`，含液态玻璃侧栏 v1 + 黑条修复；**主项目没让动别动**）。

## 0. 一句话现状

本目录是**实验备份**（从主项目 `585579f` 分出，后补了 `d351fa4` 的 `overflow-x: clip` 修复）。目标：苹果 WWDC25 级液态玻璃。**待办 1-3 已收尾（2026-09-10 第二轮）**：球体边缘光晕已恢复、闪烁经 120Hz 实测定性（见 §5.1 结论）、深色主题已全项验收。第三轮修了两处断点（§5.5、§5.6）。**期间另一个 agent 做过一版失败改动（WebGL 球体层 + conic 噪纹 + 呼吸光斑等），用户否定后已逐块精确回滚到第三轮状态（§5.7）**。全部改动**未提交 git、未上线**，纯本地实验。

- 本地预览：`cd "/Users/user/Kimi Code/portfolio-hero-backup-20260910" && python3 -m http.server 8980` → http://localhost:8980/
- ⚠️ 8933、8940 端口被上一 session 遗留的旧 python 服务占用（返回旧版页面），别用；8980 也可能已有一个在跑（lsof 查一下）

## 1. 本对话做了什么（按顺序）

1. **侧栏水波纹**：`lg-refract` 噪波频率改纵向拉伸波带（后已随滤镜全部删除，见教训 1）
2. **卡片液态玻璃三层**（玻璃扭曲/色调遮罩/角区折射）→ **用户指出改错对象**：要做的是左侧大面板不是右侧小卡片 → 全部回滚，三层改到侧栏；后又应用户要求把**圆润圆角（20px 36px 20px 36px）和 hover 缩放（translateY(-3px) scale(1.02) + 阴影加深）保留给小卡片**（`.card/.blog-card/.fan-card/.contact-panel`，玻璃底纹维持原配方 `blur(24px) saturate(1.4)`）
3. **侧栏全透明玻璃**：用户要"全透明、清晰看到球体、不要模糊"——`.side-glass` 去掉全部 blur 和厚染，只剩 `saturate(1.7)` + 近零薄染；40px 右侧圆角 + `.side-corners` 角区 + 高光描边 + 流光 `::after`
4. **清晰/模糊分区**：球体自身 blur 去掉（恢复锐利渐变球），模糊由"整层 backdrop blur + mask 挖掉侧栏区"承担 → 球体升级为**高光立体球**（左上亮斑+饱和核+软边），新增 b7/b8/b9 补侧栏可视条带（照片右侧，top 20%/46%/74%，left 49–56%）→ 右侧嫌边缘太锐，渐变尾端拉长（mid 50%、transparent 80%）+ 整层 blur 68px
5. **性能三轮救火**（详见教训 1，全部失败在机制上）：去 SMIL → 去整屏 backdrop blur（改双层球体：清晰层 mask 留侧栏区、模糊层 mask 留外部并逐球 blur）→ 去 backdrop url()（折射改烘焙到球体层 filter: url()）→ **最终全部 url() 滤镜清零**（含 SVG defs），液滴感改用零成本 squash transform
6. 结果：闪烁大幅改善但**偶发仍有**；用户指出**左侧球体边缘光晕没了**（高光立体球的饱和核太大、光晕尾端太短）

## 2. 当前实现结构（要点）

- **背景**：`.fx-bg>.fx-gradient`（42s 漂移渐变场）+ **双层球体**：`.fx-bubbles`（清晰层，9 球高光立体球，mask 只留 `--sbw` 左侧 80px 羽化）+ `.fx-bubbles.blurred`（同位同步 9 球，逐球 blur 32–64px，mask 只留外部）。`--sbw` 由侧栏宽度 lerp（底部脚本 tick/drive）同步写到 `documentElement`——侧栏展开左清右糊、收拢全糊，无需 JS 干预球体
- **侧栏玻璃**：`.side-glass`（`backdrop-filter: saturate(1.7)` + 近零薄染，全透明）+ `::before`（22px 环带高光描边，无滤镜）+ `::after`（流光 16s）+ `.side-corners`（mask 只留右上/右下角区，无滤镜，亮边）+ 右侧 `border-radius: 0 40px 40px 0` + 外投影。`.side-inner` z-index 1 压上
- **点缀**：`.fx-lines`（右上勾线装饰，90s 缓转，小屏隐藏）、`.fx-dots`（8 个 3px 微粒，上浮闪烁）
- **卡片**：原玻璃配方 + 圆润圆角 + hover 缩放（见 1.2）
- **没有任何 SVG 滤镜、没有 SMIL、没有整屏 backdrop 模糊层**——这是用三轮失败换来的，别再引入（教训 1）

## 3. 用户偏好（本对话新增，与 HANDOFF2 合并有效）

- **验收标准极高，放大看细节**："你自己看看这清晰吗？你的验收标准过低"——改完必须自己截图放大检查，达不到苹果级就继续优化，别急着交付
- **效果目标具体可感**："全透明玻璃、清晰看到球体、球体边缘要模糊、渐变拉大"——会逐条验收；左右两侧的清晰/模糊对比是他在意的核心效果
- **不要降级视觉效果**：修性能问题不许砍效果，找根因换实现
- **对闪烁/卡顿/渲染不同步零容忍**：包括偶发。截图里卡片位置残留（合成器 desync）这种也会抓到
- **会纠正自己的错误认知**："我让你改的是左侧不是右侧小卡片！"——仔细读他指的对象，别自作主张扩大改动范围；但被纠正后保留的部分（圆角、hover）他会再补话，**以最新一条为准**
- **实验在备份目录做，只改本地**；主项目上线必须他明确说
- **每轮迭代后附上本地链接**（http://localhost:8980/）——他要自己打开看效果（2026-09-10 新增）

## 4. 经验教训（血泪，按重要性排序）

1. **SVG url() 位移滤镜（feTurbulence+feDisplacementMap）是闪烁/卡顿/desync 的根源，三种用法全部死路**：
   - `backdrop-filter: url()`：Chrome 对 backdrop 引用 SVG 滤镜有已知缺陷，全页回读，滚动/重绘必闪
   - 普通 `filter: url()` 用在大面积固定图层（视口大小）：合成器 desync——出现"卡片画在旧位置、左右不同步"的残留帧（用户截图实锤）
   - SMIL 动画驱动噪波：每帧重算全幅滤镜，页面持续闪烁
   - **结论：本项目禁止再用任何 url() 滤镜 + SMIL。真正折射的唯一不闪路径是 WebGL shader**（首屏 main.js 原生 WebGL 全程 60fps 已验证；要做侧栏折射层就走这条，约半天工程量）
2. **整屏 `backdrop-filter: blur()`（68px 视口级）+ 跟随动画的 mask**：逐帧全屏重采样 + mask 动画时全屏闪烁。用"双层球体+分区 mask+逐球 blur"替代后视觉等价、成本骤降
3. **改之前先看清用户指的对象**：三层液态玻璃误加到右侧小卡片，全部返工。对象错了，做得越好返工越多
4. **验收要自己放大截图**：b4/b6 球被 PHOTO 占位图挡住导致"玻璃下没球"，不放大区域截图根本发现不了。验收清单：浅色/深色/边缘特写/收拢状态/滚动后，一个不能少
5. **CSS 优先级坑**：主题玻璃组 `[data-theme="x"] #site .card`（1,2,0）会压过后来写的 `#site .card`（1,1,0）同属性——新规则要么带主题前缀，要么接受被压（backdrop-filter 被压过一次，border-radius 同优先级靠后胜出）
6. **webbridge 合成 wheel 测试的坑**：后台标签页 rAF 节流会让侧栏 lerp 卡死（`driving` 标志卡 true），表现为"收拢/展开失效"——不是产品 bug，测试前 `Page.bringToFront`；`scrollTo` 用 `document.scrollingElement.scrollTop = 0` 直接赋值（CSS smooth 会劫持数值型 scrollTo）
7. **无头验证姿势**（浏览器扩展断开时的备用）：`sed` 临时副本 `_test.html`（`<body class="hero-gone">` + hero `display:none`）→ 无头 Chrome `--virtual-time-budget=4000` 截图 → 删副本。能验证渲染结果，不能验证交互性能
8. **球体美感**：纯径向渐变色块太"平"；高光立体球 = 亮斑 + 饱和核 + 长尾光晕。**两个翻车点**：核大尾短（0–50%/80%）→ 实心盘没光晕；核小 + 亮斑强（0.8）→ 亮斑漂白中心、和外围色环形成"断点"（中空外环，被用户截图抓到）。**定稿**：7 停平滑衰减（0.95/0.82/0.6/0.38/0.2/0.08/0，深色等比缩）+ 亮斑 ≤0.55/22%（深 0.4）——强核、连续光晕、无断点
9. **收拢路径的压测前提**：阶段1 wheel 拦截要求 `scrollY <= 0`；而 `finishEnter()` 会把 scrollY 换算到约一个视口处。合成 wheel 压测收拢前必须 `document.scrollingElement.scrollTop = 0`，否则 wheel 只是普通滚动、collapseP 不动——第一轮 rig 因此白跑，**压测前先探针确认目标状态真的发生**（如侧栏宽度 983→16→983）
10. **macOS 窗口遮挡节流**：有头调试窗口被遮挡/非前置时 rAF 整体暂停（实测 30s 空档，恢复后出现 75-133ms 长帧簇）——形似闪烁但是测量假象。纪律：测量前 `Page.bringToFront`、加 >1s 失速检测剔除污染轮、screencast（120fps JPEG）本身有开销需做无录屏对照
11. **无头 60Hz ≠ 真实 120Hz**：headless 用 60Hz 虚拟显示，ProMotion 机器上 120Hz 才暴露的偶发问题无头永远复现不了。真实路径：webbridge（扩展连着时）或 `--user-data-dir=/tmp/xxx --remote-debugging-port` 有头实例 + Node24 原生 WebSocket CDP（/tmp/flicker_rig.mjs：rAF 卡帧日志 + 逐帧录屏 + /tmp/flicker_diff.py 做 A→B→A 单帧异常检测）
12. **边缘高光只有细线必断**：1.2px 白描边的可见度随背景明暗波动，亮背景段必被吃掉（用户圈图抓到）。连续边缘发光 = 细亮芯（`inset -2px 0 6px`）+ 宽晕影（`inset -8px 0 20px`）双层，全高覆盖，与角区 accent 自然融合

## 5. 待办（用户点名，按优先级）——2026-09-10 第二轮已收尾 1-3

1. ~~偶发闪烁继续 debug~~ **已定性（不改代码）**。用自搭 CDP rig（/tmp/flicker_rig.mjs，Node24 原生 WebSocket 驱动 Chrome，rAF 卡帧日志 + 逐帧录屏 diff）实测：
   - **这台机器是 120Hz ProMotion**（有头窗口 rAF 均值 8.4ms）——之前所有 60Hz 无头验证都发现不了问题的原因之一
   - 120Hz 真实窗口 + 真实收拢路径（scrollY≤0 时合成 wheel 驱动 collapseP）压力下：15 循环 soak **零 >25ms 帧**；此前 10+ 轮二分仅抓到零星 25-75ms 孤立帧和一次 325ms（expand 路径），不可稳定复现，**无单一机制可归因**
   - 二分结论：**双层 mask 已排除**（关 mask 反而出现最糟事件簇）；**saturate(1.7) 必须保留**（A/B 截图侧栏区 diff 均值 17-25/255，砍掉=明显褪色，且它只是色彩矩阵不是 blur，GPU 成本低）
   - 残留认知：收拢/展开 lerp 期间每帧全页文字重排（侧栏 width 动画 → 右栏逐帧换行）+ 双 mask 重栅格 + saturate 区域变化，理论成本最高；若用户仍报闪烁，备选项：`--sbw` 量化 4px 步进、off-screen section 加 content-visibility、或上 WebGL（见待办 4）
2. ~~恢复左侧球体边缘光晕~~ **已完成（两轮迭代）**。v1（核 0–30% + 62% 单中间停 + 亮斑 0.8）被用户抓到**环状断点**：亮斑漂白中心 + 核太弱 → 中空外环。v2 定稿：**7 停平滑衰减**（0% 核 0.95 → 20% 0.82 → 35% 0.6 → 50% 0.38 → 65% 0.2 → 80% 0.08 → 100% 0，深色等比缩）+ **亮斑压到 0.55/22%（深色 0.4）**。两主题 18 条渐变（模糊层共享规则，blur 主导无感）。已放大截图验收：强核 + 连续长尾光晕 + 无断点，深浅两主题、真实窗口原生 DSF 均成立
3. ~~深色主题补验~~ **已完成**（真实窗口原生 DSF 截图）：球体光晕✓、侧栏玻璃 40px 圆角+高光描边✓、文字对比度✓、收拢全糊态✓、滚动后卡片/扇形/blog✓、浅色同步复验✓
4. （用户发话才做）WebGL 折射层：侧栏背景真正折射，main.js 同路线
5. ~~侧栏右缘发光断点~~ **已完成（2026-09-10 第三轮）**。成因：边缘只有 1.2px 细白线，可见度随背景明暗波动——中段亮背景（球体光晕+浅渐变场）把白线吃掉，两角有 `.side-corners` 加持所以只有中段断。修复：`.side-glass::before` 加两条右缘全高内发光 `inset -2px 0 6px`（细亮芯，浅 0.5/深 0.38）+ `inset -8px 0 20px`（宽晕影，浅 0.22/深 0.16）——整缘连续微发光，任何背景下不断。已分段放大验收：浅/深 × 上/中/下全连续，整页观感不刺眼
6. ~~球体环状断点~~ **已完成（2026-09-10 第三轮，即 v2 渐变）**。v1 修光晕时亮斑 0.8 漂白弱核形成"中空外环"断点（用户圈图抓到）。定稿：7 停平滑衰减（0.95/0.82/0.6/0.38/0.2/0.08/0，深色等比缩）+ 亮斑 ≤0.55/22%（深 0.4），强核+连续光晕+无断点。详见教训 8
7. **回滚记录（2026-09-10 第四轮）**：另一个 agent 做过一版失败改动，用户否定，已逐块精确回滚到第三轮状态。被回滚的内容：① WebGL 球体折射层（fx-bubbles.js + canvas #fx-gl，CSS 双层被 display:none 隐藏）；② 18 条球体渐变加 `repeating-conic-gradient` 噪纹晕环（油画笔触方向）；③ bubble-float 改 8 帧 wobble（x 向 ±4px 游移）；④ `.side-glow` 右缘呼吸光斑层；⑤ `::before` 第三层 `inset -26px 0 44px` 宽晕；⑥ `content-visibility: auto` 离屏优化；⑦ `--sbw` 4px 量化。**其中 ⑥⑦ 本是 §5.1 备选项——回滚是应用户"回到上一迭代"要求，不代表方案错误；若再做闪烁优化可重新评估**。回滚验证：grep 零残留 + 与第三轮截图像素 diff ≤24/255（动画相位噪声级）

## 6. 快速上手

```bash
cd "/Users/user/Kimi Code/portfolio-hero-backup-20260910"
python3 -m http.server 8980   # 预览（如被占用先 lsof -nP -iTCP:8980 -sTCP:LISTEN 查）
# 无头验证（无浏览器时）：
sed -e 's/<body>/<body class="hero-gone">/' -e 's/<section class="hero">/<section class="hero" style="display:none">/' index.html > _test.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1600,1000 --virtual-time-budget=4000 --screenshot=/tmp/x.png "http://localhost:8980/_test.html"; rm _test.html
# 交互验证：kimi-webbridge，session 名 portfolio-rebuild，测前 cdp Page.bringToFront
# 扩展断开时的真实浏览器路径（120Hz 实测）：
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir=/tmp/chrome-debug-profile --remote-debugging-port=9334 --no-first-run --window-size=1600,1000 about:blank &
RIG_PORT=9334 RIG_NOEMULATE=1 node /tmp/flicker_rig.mjs <run名> <二分开关JS|-> <循环数>   # 卡帧日志+录屏到 /tmp/flicker_frames/<run名>
python3 /tmp/flicker_diff.py /tmp/flicker_frames/<run名>   # A→B→A 单帧异常检测
```

**禁止**：提交 git、推 GitHub、动主项目 `portfolio-hero/`、引入任何 SVG url() 滤镜/SMIL/整屏 backdrop 模糊层。
