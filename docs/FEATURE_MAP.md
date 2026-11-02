# 功能与文件对照

| 功能 | 文件 | 验证 |
| --- | --- | --- |
| MV3、仅 LinkedIn、图标 | manifest.json、icons/*.png | tests/manifest.test.js |
| 公司名规范化 | src/lib/company.js | tests/company.test.js |
| 担保名册匹配（在册 / 不在册 / 无法判定）、备注校验、来源文案 | src/lib/sponsors.js、src/data/sponsors-meta.json、src/data/sponsors-names.txt.gz | tests/sponsors.test.js |
| 从 GOV.UK CSV 重新打包名册 | scripts/refresh-sponsors.mjs | 手动 `npm run sponsors:refresh` |
| 本地日期、每日 3 次、职位去重、并发串行 | src/lib/quota.js | tests/quota.test.js |
| ERJ1. 离线许可 | src/lib/license.js、scripts/gen-license.mjs | tests/license.test.js |
| LinkedIn 候选与文本兜底 | src/content/selectors.js | tests/selectors.test.js；真站待验收 |
| 右侧中文面板、手动触发、名册引用 | src/content/content.js | 文案由 formatSponsor 覆盖；Chrome 人工验收待完成 |
| 后台解压本地名册、校验备注、统一计次 | src/background/service-worker.js | tests/background.test.js |
| 当前标签页触发、配额展示 | src/popup/popup.html、src/popup/popup.js | Chrome 人工验收待完成 |
| 本地备注 JSON、离线许可、来源说明 | src/options/options.html、src/options/options.js、src/data/sponsor-note-example.json | 校验逻辑自动测试；UI 待验收 |
| 纸色朱红中文界面 | src/ui/theme.css、src/ui/pages.css | 沿用原样式 |

所有 lib 使用 UMD 式封装，可在 Node require 和浏览器 globalThis.EmployerRatings 下使用。不抓取评分站点，运行时不连接外部 API。名册为公开 GOV.UK CSV 的离线裁剪，说明见 README。
