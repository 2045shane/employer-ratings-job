# 招聘页查询签证担保

独立 Chrome Manifest V3 插件。在 LinkedIn 职位页查询雇主名称是否出现在英国官方 **Skilled Worker** 担保名册上。这不是雇主评分，也不再内置虚构的星级。

界面仍是纸色背景、朱红按钮、中文卡片。代码放在 src/lib、src/content、src/popup、src/options、src/background、src/ui。运行时不请求评分 API，也不下载名册。

## 本地安装

1. 在 Chrome 地址栏输入 `chrome://extensions`。
2. 打开右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库目录。
4. 打开或刷新 LinkedIn 职位详情页（`/jobs/view/`，或 `/jobs/search` 右侧已选职位），点击页面右侧「查询签证担保」，或扩展弹窗「查询当前职位担保」。
5. 点击「设置」可保存本地备注，或输入离线许可。

## 名册里有什么

打包文件来自 [GOV.UK Register of licensed sponsors: workers](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers) 的公开 CSV（Open Government Licence v3.0）。当前快照见 `src/data/sponsors-meta.json` 的 `csvDate` 与 `retrieved`。

只保留 **Route = Skilled Worker** 的机构名，并按原文去重：

- `src/data/sponsors-names.txt.gz`：一行一个机构名（gzip，约 1 MB）
- `src/data/sponsors-meta.json`：来源、CSV 地址、CSV 日期、打包日期、机构数、SHA-256

不打包 Town/City、County，也不打包 CSV 里的 **Type & Rating**。那一列是内政部牌照等级，不是 Glassdoor 一类的雇主评分，界面上不会显示成分数。

查询只在本机把 LinkedIn 上的公司名对到这份名单：

| 结果 | 含义 |
| --- | --- |
| 在册：是，置信高 | 规范化后与某一家官方名称一致，或与名册里写明的商号（`T/A` / `trading as`）一致 |
| 在册：是，置信中 | 没有完全同名，但只对应一家更长的官方名称 |
| 无法判定，置信低 | 对上多家机构。不标成在册，也不标成不在册 |
| 在册：否 | 这份 Skilled Worker 快照里没有该名称 |

「否」只说明**这个名称**不在**这份日期的 Skilled Worker 名单**里。商号和注册名不同、快照较旧，或雇主持有其他路线的担保，都会得到「否」。

面板会写出来源名称、CSV 日期、打包日期和公开页面。同一职位当天重复查看不计次；未识别公司或职位 ID 不扣次。未命中也会扣 1 次。每日免费 3 个职位，超限仍显示：

> 免费次数已用完，解锁请小红书私信「珊哥爱读书」

## 如何更新名册

在仓库根目录执行（需要能访问 gov.uk，无需密钥或付费 API）：

```bash
npm run sponsors:refresh
```

脚本会打开上述 GOV.UK 页面，选取文件名日期最新的 Worker and Temporary Worker CSV，过滤 Skilled Worker，覆盖 gzip 与 meta。请核对终端里的日期和机构数，再跑 `npm test`。机构数少于 1 万时脚本会拒绝写入。

不要手改 gzip 里的名字，也不要补上自己编的分数。本地备注不是名册的一部分。

## 本地备注

备注存在 `chrome.storage.local` 的 `erjSponsorNotes`，只在结果旁显示「本地备注（非官方）」。保存 `{}` 清空。不能写 overall、星级或推荐率；非法 JSON 不会覆盖已保存内容。

```json
{
  "Acme Trading": {
    "note": "本地备注，不会被当成官方在册结论",
    "updated": "2026-11-02"
  }
}
```

公司名会去掉大小写、空白、引号和括号，把 `&` 当成 and，并去掉 Inc./LLC/Ltd./PLC/LLP/GmbH/有限公司等后缀。

## 离线许可与开发

运行 `node scripts/gen-license.mjs` 或 `npm run license` 生成 `ERJ1.` 许可。许可仍按 SHA-256 和固定种子 `employer-ratings-job:unlock:v1` 校验。公开算法不具备防破解能力，MVP 未接入支付。

运行 `npm test`（`node --test tests/*.js`），无需安装依赖。需要 Node.js 22（后台和测试用 `DecompressionStream` 解压名册）。后台用扩展自身 URL 读取数据，页面不直接读取名单，因此不需要 web_accessible_resources。权限只有 storage、activeTab，站点只有 `https://www.linkedin.com/jobs/*`。

## 已知限制

- **DOM 易变、选择器未在真站验收。** 搜索页必须选中带 `currentJobId` 的职位。
- **不是雇主评分，也不是「这家公司好不好」。** 只回答名称是否出现在所打包的 Skilled Worker 名册。
- **只做名称匹配。** 名册原文里的 `T/A` 会单独索引；LinkedIn 上的品牌如果和注册名对不上，会得到「否」或「无法判定」。规范化后变成同一个键的写法（例如 Ltd 与 Limited）视为同一家。
- **不包含其他担保路线**（例如 Global Business Mobility、Creative Worker）。
- **不联网刷新。** 结果新旧取决于打包的 CSV 日期。
- 免费配额与许可只在本机；清除存储或修改系统日期可以绕过。
- 包名目录仍叫 `employer-ratings-job`，那是仓库原名，不代表现在还提供评分。

功能与文件对照见 [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md)。

Contains public sector information licensed under the Open Government Licence v3.0.
