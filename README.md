# 招聘页显示雇主评分

独立 Chrome Manifest V3 插件 MVP，无外部依赖，无联网评分查询。采用与参考仓一致的纸色背景、朱红按钮、中文卡片界面，以及 src/lib、src/content、src/popup、src/options、src/background、src/ui 结构。图标复制自 ghost-job-detect；参考仓未修改。

## 本地安装

1. 在 Chrome 地址栏输入 `chrome://extensions`。
2. 打开右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本目录 `/workspace/employer-ratings-job`。
4. 打开或刷新 LinkedIn 职位详情页（`/jobs/view/`，或 `/jobs/search` 右侧已选职位），点击页面右侧「查看评分」，或扩展弹窗「查看当前职位评分」。
5. 点击「设置」编辑公司评分 JSON，或输入离线许可。

## 评分和计次

内置 `src/data/sample-ratings.json` 包含 15 家公司的**示例数据（非真实评分）**，所有数值均为演示用途，不可据此判断真实雇主。面板展示公司、星级及数值、工作生活平衡、薪酬、推荐率、来源和日期。用户自定义数据另标「未经核验」；来源含「示例」时继续突出示例标识。

打开页面、弹窗、自动检查页面地址均不计次。只有主动点击查询并成功识别公司与职位 ID 才计次；同一职位本地同一天重复查看不再计次，搜索右侧详情与直接链接通过 LinkedIn 职位 ID 去重。未匹配评分也算查询一个职位，面板提示在设置中添加；未识别公司或职位 ID 不扣次。每日免费 3 个职位，按电脑本地日期重置，后台串行处理并发请求。超限显示：

> 免费次数已用完，解锁请小红书私信「珊哥爱读书」

自定义 JSON 存于 `chrome.storage.local`，按规范化公司名合并覆盖内置 map；保存 `{}` 清除覆盖，保存整个 JSON 会替换之前的自定义 map。公司名统一大小写、空白、`&/and`，去除 Inc./LLC/Ltd./Corp./GmbH/有限公司等后缀。示例：

```json
{
  "Acme Inc.": {
    "overall": 4.1,
    "workLife": 4,
    "compensation": 4.2,
    "recommendPct": 80,
    "source": "用户手动录入（请填写可核实的来源）",
    "updated": "2026-11-01"
  }
}
```

三个评分字段为 1–5 数值，推荐率为 0–100 数值，来源必填，日期须为有效的 YYYY-MM-DD；格式或范围错误不会覆盖已保存数据。自定义来源是用户输入，不代表插件验证过其真实性。JSON、评分和公司名仅在本机处理，不上传数据。

## 离线许可与开发

运行 `node scripts/gen-license.mjs` 或 `npm run license` 生成 `ERJ1.` 许可，在设置中保存。许可按 SHA-256 和固定种子 `employer-ratings-job:unlock:v1` 校验，解锁后不限次数。留空保存可清除许可。公开算法与本地存储不具备防破解或可信付费鉴权能力，MVP 未接入支付。

运行 `npm test`（`node --test tests/`），无需安装任何依赖。Node.js 18+。后台通过扩展自身 URL 读取 JSON，页面不直接读取数据，因此不需要 web_accessible_resources。仅申请 storage、activeTab，站点范围仅为 LinkedIn jobs 和 Indeed；没有分析、远程脚本或评分 API 请求。

## 已知限制及 TODO

- **DOM 易变、选择器未真站验收**：LinkedIn 的多组候选与文本兜底需要在真实登录状态、不同语言和布局下验收，可能识别失败或误识别；SPA 按地址变化更新提示。搜索结果必须选中具有 `currentJobId` 的职位。
- **评分为示例数据**，不是 Glassdoor、Indeed 或任何第三方的真实评分。当前只做完整规范化名称匹配，不做别名或模糊匹配。
- **Indeed 仅占位选择器 + TODO**，未承诺可用；仅在 URL 带 `jk` 或 `vjk` 时具备职位去重标识。
- 不抓取 Glassdoor 等第三方站点，避免 ToS/CORS 问题。TODO：未来接入合规公开数据源或自建 API，补充授权、更新与来源核验机制。
- 免费配额与许可保存在当前浏览器本机；清除存储、修改系统日期或源码可绕过，设备间不共享。
- 未来可与签证担保查询 `visa-sponsor-checker` 合并，作为付费版卖点；**本仓始终是独立 MVP**，当前未依赖或集成该项目。

功能与文件对照见 [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md)。本次仅离线实现与自动测试，未进行 Chrome UI 或真实招聘站点验收。
