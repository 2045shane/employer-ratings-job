# 功能与文件对照

| 功能 | 文件 | 验证 |
| --- | --- | --- |
| MV3、权限、图标 | manifest.json、icons/*.png | tests/manifest.test.js |
| 公司名规范化 | src/lib/company.js | tests/company.test.js |
| 评分匹配、覆盖与 JSON 校验 | src/lib/ratings.js、src/data/sample-ratings.json | tests/ratings.test.js |
| 本地日期、每日 3 次、职位去重、并发串行 | src/lib/quota.js | tests/quota.test.js |
| ERJ1. 离线许可 | src/lib/license.js、scripts/gen-license.mjs | tests/license.test.js |
| LinkedIn 候选与文本兜底、Indeed TODO | src/content/selectors.js | tests/selectors.test.js；真站待验收 |
| 右侧中文面板、手动触发、示例警示 | src/content/content.js | Chrome 人工验收待完成 |
| 后台读本地 JSON、校验配置、统一计次 | src/background/service-worker.js | tests/background.test.js |
| 当前标签页触发、配额展示 | src/popup/popup.html、src/popup/popup.js | Chrome 人工验收待完成 |
| 自定义评分 JSON、离线许可设置 | src/options/options.html、src/options/options.js | 校验逻辑自动测试；UI 待验收 |
| 纸色朱红中文界面 | src/ui/theme.css、src/ui/pages.css | 参考 fabric-score-check 样式 |

所有 lib 使用 UMD 式封装，可在 Node require 和浏览器 globalThis.EmployerRatings 下使用。不抓取第三方评分站点，不连接外部 API。具体限制及未来合规数据源、visa-sponsor-checker 合并方向见 README。
