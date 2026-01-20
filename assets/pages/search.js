import { escapeHtml } from "../lib/strings.js";
import { pills, pillLink, badge, emptyState } from "../components.js";

function groupByType(results) {
  const m = new Map();
  for (const r of results) {
    const key = r.type;
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(r);
  }
  return m;
}

export function renderSearchPage(ctx) {
  const { route, app, search } = ctx;
  const q = route.query.q || "";
  const results = q ? search(q, 80) : [];

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">全库检索</div>
          <div class="card-desc">覆盖：合作文件、法律法规、机构/组织、动态、案件、研究、术语库。</div>
        </div>
      </div>
      <div class="card-body">
        <form class="filters" id="searchForm">
          <div class="field" style="flex:1">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="例如：merger notification / Google / Competition Policy / Article 102" />
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">搜索</button>
          </div>
        </form>

        ${q
          ? results.length
            ? `<div style="margin-top:12px">
                <div class="muted">共 <b>${results.length}</b> 条结果（按相关度）。</div>
                ${Array.from(groupByType(results).entries())
                  .map(
                    ([type, list]) => `
                      <div class="search-group">
                        <div class="search-group-title">${escapeHtml(type)} <span class="badge">${list.length}</span></div>
                        <div class="list">
                          ${list
                            .slice(0, 10)
                            .map(
                              (r) => `
                                <a class="list-item" href="${escapeHtml(r.url)}">
                                  <div class="list-main">
                                    <div class="list-title">${escapeHtml(r.title)}</div>
                                    <div class="list-sub">${escapeHtml(r.subtitle)}</div>
                                  </div>
                                  <div class="list-meta"><span class="badge">${escapeHtml(r.tags?.[0] || "")}</span></div>
                                </a>
                              `
                            )
                            .join("")}
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>`
            : `<div style="margin-top:12px">${emptyState("未检索到结果", "请尝试更换关键词或减少筛选条件。")}</div>`
          : `<div style="margin-top:12px" class="muted">请输入关键词开始搜索。</div>`}
      </div>
    </div>
  `;

  return {
    key: "search",
    title: "全库检索",
    crumbs: [{ label: "全库检索" }],
    html,
    init: () => {
      const form = document.getElementById("searchForm");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const s = String(fd.get("q") || "").trim();
        location.hash = `#/search${s ? `?q=${encodeURIComponent(s)}` : ""}`;
      });
    },
  };
}
