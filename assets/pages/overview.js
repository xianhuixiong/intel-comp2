import { escapeHtml, formatDate, uniq } from "../lib/strings.js";
import { badge, externalLink, pillLink, pills, section } from "../components.js";

function kpi(label, value) {
  return `
    <div class="card pad">
      <div class="stat">
        <div>
          <div class="stat-kpi">${escapeHtml(value)}</div>
          <div class="stat-label">${escapeHtml(label)}</div>
        </div>
        <div class="muted" aria-hidden="true">↗</div>
      </div>
    </div>
  `;
}

export function renderOverview(ctx) {
  const { data, app } = ctx;

  const counts = {
    docs: data.documents.length,
    laws: data.laws.length,
    agencies: data.agencies.length,
    orgs: data.organizations.length,
    updates: data.updates.length,
    cases: data.cases.length,
    research: data.research.length,
  };

  const recentUpdates = [...data.updates]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 6);

  const featuredCases = [...data.cases]
    .sort((a, b) => String(b.decisionDate).localeCompare(String(a.decisionDate)))
    .slice(0, 4);

  const quick = [
    pillLink("#/cooperation", "进入国际合作法律文件库"),
    pillLink("#/laws", "进入域外法律法规库"),
    pillLink("#/agencies", "进入执法机构信息库"),
    pillLink("#/updates", "进入政策动态监测"),
    pillLink("#/cases", "进入重大案例库"),
    pillLink("#/analytics", "进入数据统计与分析"),
    pillLink("#/research", "进入专题研究与参考"),
  ];

  const dataScope = uniq([
    ...data.jurisdictions.map((j) => j.nameCn),
    ...data.organizations.map((o) => o.abbrev),
  ]).slice(0, 12);

  const html = `
    <div class="grid cols-2">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">数据库模块总览</div>
            <div class="card-desc">
              以“真实来源 + 结构化元数据 + 可追溯引用”为核心的数据标准，覆盖：国际合作文件、域外法律法规、执法机构与国际组织、政策动态、重大案件、统计分析、专题研究。
            </div>
          </div>
          <div class="right">
            <div class="badge primary">DATA_VERSION: ${escapeHtml(app.version)}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="grid cols-4">
            ${kpi("合作文件", counts.docs)}
            ${kpi("法律法规", counts.laws)}
            ${kpi("执法机构", counts.agencies)}
            ${kpi("国际组织", counts.orgs)}
          </div>
          <div class="grid cols-3" style="margin-top: 14px">
            ${kpi("政策动态", counts.updates)}
            ${kpi("重大案件", counts.cases)}
            ${kpi("研究与参考", counts.research)}
          </div>

          <div style="margin-top: 14px">
            <div class="muted" style="margin-bottom: 8px">快速入口</div>
            ${pills(quick)}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">本原型的数据覆盖范围（示例）</div>
            <div class="card-desc">示例数据仅展示结构与检索体验；生产版可按辖区/机构扩展至全量。</div>
          </div>
        </div>
        <div class="card-body">
          <div class="muted" style="margin-bottom: 8px">覆盖辖区 / 国际组织</div>
          <div class="pill-links">
            ${dataScope.map((x) => `<span class="pill">${escapeHtml(x)}</span>`).join("")}
          </div>
          <div class="callout" style="margin-top: 12px">
            <div class="callout-title">UE 设计重点</div>
            <div class="callout-body">
              统一目录与跳转：从“文件—法律—机构—动态—案例—研究”的任何一处，都能一键回到相关实体与证据链。
              列表页强调“多维筛选 + 导出 + 收藏”，详情页强调“要点结构化 + 关联跳转 + 原文溯源”。
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-top: 14px">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">最新政策动态</div>
            <div class="card-desc">按日期倒序展示（示例条目）。</div>
          </div>
          <div>${pillLink("#/updates", "查看全部")}</div>
        </div>
        <div class="card-body">
          <div class="list">
            ${recentUpdates
              .map(
                (u) => `
              <a class="list-item" href="#/updates/${encodeURIComponent(u.id)}">
                <div class="list-main">
                  <div class="list-title">${escapeHtml(u.titleCn || u.title)}</div>
                  <div class="list-sub">${escapeHtml(u.jurisdictionOrOrg)} · ${escapeHtml(u.type)}</div>
                </div>
                <div class="list-meta">
                  <span class="badge">${escapeHtml(formatDate(u.date))}</span>
                </div>
              </a>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">重大案件精选</div>
            <div class="card-desc">展示可对比、可复用的案例结构：事实—问题—规则—分析—救济。</div>
          </div>
          <div>${pillLink("#/cases", "查看全部")}</div>
        </div>
        <div class="card-body">
          <div class="list">
            ${featuredCases
              .map(
                (c) => `
              <a class="list-item" href="#/cases/${encodeURIComponent(c.id)}">
                <div class="list-main">
                  <div class="list-title">${escapeHtml(c.titleCn || c.title)}</div>
                  <div class="list-sub">${escapeHtml(c.jurisdiction)} · ${escapeHtml(c.authority)} · ${escapeHtml(c.sector)}</div>
                </div>
                <div class="list-meta">
                  <span class="badge primary">${escapeHtml(formatDate(c.decisionDate))}</span>
                </div>
              </a>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "overview",
    title: "总览",
    crumbs: [{ label: "总览" }],
    html,
  };
}
