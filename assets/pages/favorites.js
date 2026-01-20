import { escapeHtml, normalize } from "../lib/strings.js";
import { favButton, pillLink, pills, emptyState } from "../components.js";

function resolve(id, data) {
  const find = (arr) => arr.find((x) => x.id === id);
  if (id.startsWith("DOC-")) {
    const d = find(data.documents);
    if (!d) return null;
    return {
      id,
      type: "合作文件",
      title: d.titleCn || d.title,
      subtitle: d.title,
      url: `#/cooperation/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("LAW-")) {
    const l = find(data.laws);
    if (!l) return null;
    return {
      id,
      type: "法律法规",
      title: l.nameCn || l.nameEn,
      subtitle: l.jurisdiction + " · " + l.type,
      url: `#/laws/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("AG-")) {
    const a = find(data.agencies);
    if (!a) return null;
    return {
      id,
      type: "执法机构",
      title: a.nameCn || a.nameEn,
      subtitle: a.jurisdiction + " · " + a.abbrev,
      url: `#/agencies/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("ORG-")) {
    const o = find(data.organizations);
    if (!o) return null;
    return {
      id,
      type: "国际组织",
      title: o.nameCn || o.nameEn,
      subtitle: o.abbrev + " · " + o.type,
      url: `#/agencies/org/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("UPD-")) {
    const u = find(data.updates);
    if (!u) return null;
    return {
      id,
      type: "政策动态",
      title: u.titleCn || u.title,
      subtitle: u.jurisdictionOrOrg + " · " + u.type,
      url: `#/updates/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("CASE-")) {
    const c = find(data.cases);
    if (!c) return null;
    return {
      id,
      type: "重大案例",
      title: c.titleCn || c.title,
      subtitle: c.jurisdiction + " · " + c.authority,
      url: `#/cases/${encodeURIComponent(id)}`,
    };
  }
  if (id.startsWith("RES-")) {
    const r = find(data.research);
    if (!r) return null;
    return {
      id,
      type: "研究参考",
      title: r.titleCn || r.title,
      subtitle: r.publisher + " · " + r.type,
      url: `#/research/${encodeURIComponent(id)}`,
    };
  }
  return null;
}

export function renderFavorites(ctx) {
  const { data, route, app } = ctx;
  const q = route.query.q || "";
  const nq = normalize(q);

  const items = Array.from(app.favorites)
    .map((id) => resolve(id, data))
    .filter(Boolean)
    .filter((it) => (nq ? normalize(`${it.title} ${it.subtitle} ${it.type}`).includes(nq) : true))
    .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));

  const html = items.length
    ? `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">我的收藏</div>
          <div class="card-desc">跨模块收藏夹：文件 / 法律 / 机构 / 动态 / 案例 / 研究。</div>
        </div>
      </div>
      <div class="card-body">
        <form class="filters" id="favFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="在收藏中检索…" />
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">检索</button>
          </div>
        </form>

        <div class="list" style="margin-top:12px">
          ${items
            .map(
              (it) => `
              <div class="list-item">
                <div class="list-main">
                  <a class="list-title" href="${escapeHtml(it.url)}">${escapeHtml(it.title)}</a>
                  <div class="list-sub">${escapeHtml(it.type)} · ${escapeHtml(it.subtitle)}</div>
                </div>
                <div class="list-meta">
                  ${favButton(it.id, true)}
                </div>
              </div>
            `
            )
            .join("")}
        </div>

        <div class="muted" style="margin-top:10px">共 <b>${items.length}</b> 条收藏。</div>
      </div>
    </div>
  `
    : `
      <div class="card pad">
        ${emptyState("暂无收藏", "在列表或详情页点击 ★ 即可加入收藏。")}
      </div>
    `;

  return {
    key: "favorites",
    title: "我的收藏",
    crumbs: [{ label: "我的收藏" }],
    html,
    init: () => {
      const form = document.getElementById("favFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        const s = String(fd.get("q") || "").trim();
        if (s) params.set("q", s);
        location.hash = `#/favorites${params.toString() ? "?" + params.toString() : ""}`;
      });
    },
  };
}
