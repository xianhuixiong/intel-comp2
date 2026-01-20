import { escapeHtml } from "../lib/strings.js";
import { section } from "../components.js";

export function renderAbout(ctx) {
  const { app } = ctx;
  const html = `
    <div class="grid cols-2">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">数据标准与质量控制</div>
            <div class="card-desc">本原型聚焦信息架构与 UI/UE；生产版可在此沉淀：数据口径、审校流程、版本化与引用规范。</div>
          </div>
        </div>
        <div class="card-body">
          ${section(
            "推荐的元数据字段",
            `<ul class="ul">
              <li><b>来源</b>：sourceName + sourceUrl（必要字段），支持备选链接、访问日期、版本快照。</li>
              <li><b>主体</b>：辖区（jurisdiction）、机构（agency）、组织（org）均采用标准化 ID（可扩展映射表）。</li>
              <li><b>分类</b>：统一 type/category/tag 体系，便于跨模块检索与统计。</li>
              <li><b>翻译</b>：translation/translated 字段支持“全译/要点/标题/未译”分级管理。</li>
              <li><b>关联</b>：related 字段以 ID 形成“证据链”跳转（文件↔法律↔机构↔案例↔研究）。</li>
            </ul>`
          )}
          ${section(
            "质量控制流程（建议）",
            `<ol class="ol">
              <li>采集：按模板登记来源与元数据，保留原文版本与下载备份。</li>
              <li>清洗：统一命名、时间格式、主体 ID；去重与规范化。</li>
              <li>翻译：术语库驱动一致性；双人复核 + 抽检。</li>
              <li>发布：版本号、变更日志、审校人/时间戳。</li>
              <li>运维：监测链接有效性、定期补齐缺失字段与关联关系。</li>
            </ol>`
          )}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">部署与扩展</div>
            <div class="card-desc">纯静态前端原型，可直接 GitHub + Vercel 发布；后续可平滑升级到“前后端分离 + 全文检索”。</div>
          </div>
        </div>
        <div class="card-body">
          ${section(
            "当前版本",
            `<div class="kv">
              <div class="k">APP</div><div class="v">Antitrust International Cooperation Database Portal (Prototype v2)</div>
              <div class="k">DATA_VERSION</div><div class="v">${escapeHtml(app.version)}</div>
              <div class="k">模式</div><div class="v">Static SPA · Hash Routing · LocalStorage 收藏/偏好</div>
            </div>`
          )}
          ${section(
            "可扩展方向",
            `<ul class="ul">
              <li>后端：全文检索（Elasticsearch/OpenSearch）、爬取与定期更新、权限与日志审计。</li>
              <li>内容：批量导入（Excel/CSV）、自动翻译与术语一致性校验、引用自动生成。</li>
              <li>分析：案件/罚款/并购审查指标体系、可视化仪表盘、订阅推送与周报生成。</li>
            </ul>`
          )}
          <div class="callout">
            <div class="callout-title">合规提示</div>
            <div class="callout-body">
              本原型仅引用公开来源的标题/摘要/链接，不内置受版权保护的全文内容；生产版应按采购方要求完成材料采集、翻译与版权/授权管理。
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "about",
    title: "关于与标准",
    crumbs: [{ label: "关于与标准" }],
    html,
  };
}
