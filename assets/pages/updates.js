import { escapeHtml, formatDate, normalize, uniq, fmtImportance } from "../lib/strings.js";
import { externalLink, favButton, importanceBadge, pillLink, pills, section } from "../components.js";

function updateCard(u, isFav) {
  const imp = fmtImportance(u.importance);
  return `
    <a class="timeline-item" href="#/updates/${encodeURIComponent(u.id)}">
      <div class="timeline-dot ${imp.cls}"></div>
      <div class="timeline-content">
        <div class="timeline-head">
          <div>
            <div class="timeline-title">${escapeHtml(u.titleCn || u.title)}</div>
            <div class="timeline-sub">${escapeHtml(u.jurisdictionOrOrg)} · ${escapeHtml(u.type)}</div>
          </div>
          <div class="timeline-meta">
            <span class="badge">${escapeHtml(formatDate(u.date))}</span>
            ${importanceBadge(u.importance)}
          </div>
        </div>
        <div class="timeline-desc">${escapeHtml(u.summaryCn)}</div>
      </div>
    </a>
  `;
}

function updateRow(u, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/updates/${encodeURIComponent(u.id)}">${escapeHtml(u.titleCn || u.title)}</a>
      <div class="row-sub">${escapeHtml(u.jurisdictionOrOrg)} · ${escapeHtml(u.type)}</div>
    </td>
    <td>${escapeHtml(formatDate(u.date))}</td>
    <td>${importanceBadge(u.importance)}</td>
    <td>
      <div class="row-actions">
        ${favButton(u.id, isFav)}
        ${externalLink(u.sourceUrl, "原文")}
      </div>
    </td>
  </tr>`;
}

export function renderUpdatesList(ctx) {
  const { data, route, app } = ctx;
  const view = route.query.view || "timeline"; // timeline | table
  const q = route.query.q || "";
  const src = route.query.src || "";
  const type = route.query.type || "";
  const minImp = Number(route.query.minImp || "0") || 0;

  let items = [...data.updates];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((u) => normalize(`${u.title} ${u.titleCn} ${u.summaryCn} ${u.jurisdictionOrOrg} ${(u.tags||[]).join(" ")}`).includes(nq));
  }
  if (src) items = items.filter((u) => u.jurisdictionOrOrg === src);
  if (type) items = items.filter((u) => u.type === type);
  if (minImp) items = items.filter((u) => Number(u.importance) >= minImp);

  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const srcOptions = uniq(data.updates.map((u) => u.jurisdictionOrOrg)).sort();
  const typeOptions = uniq(data.updates.map((u) => u.type)).sort();

  const tabs = pills([
    pillLink("#/updates?view=timeline", "时间线"),
    pillLink("#/updates?view=table", "表格"),
  ]);

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">政策动态监测</div>
          <div class="card-desc">按时间线浏览、按辖区/组织与主题筛选、关键字检索；支持重要性标记与收藏。</div>
        </div>
        <div class="right">${tabs}</div>
      </div>
      <div class="card-body">
        <form class="filters" id="updateFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="标题 / 摘要 / 标签…" />
          </div>
          <div class="field">
            <label>来源（辖区/组织）</label>
            <select name="src">
              <option value="">全部</option>
              ${srcOptions.map((v) => `<option value="${escapeHtml(v)}" ${src===v?"selected":""}>${escapeHtml(v)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>类型</label>
            <select name="type">
              <option value="">全部</option>
              ${typeOptions.map((v) => `<option value="${escapeHtml(v)}" ${type===v?"selected":""}>${escapeHtml(v)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>重要性（最低）</label>
            <select name="minImp">
              <option value="0" ${minImp===0?"selected":""}>不限</option>
              <option value="1" ${minImp===1?"selected":""}>一般及以上</option>
              <option value="2" ${minImp===2?"selected":""}>重要及以上</option>
              <option value="3" ${minImp===3?"selected":""}>特别重要</option>
            </select>
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">应用筛选</button>
          </div>
        </form>

        ${view === "table" ? `
          <div class="table-wrap" style="margin-top:12px">
            <table class="table">
              <thead>
                <tr>
                  <th>动态</th>
                  <th>日期</th>
                  <th>重要性</th>
                  <th style="width:180px">操作</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((u) => updateRow(u, app.favorites.has(u.id))).join("") || `<tr><td colspan="4"><div class="muted">未检索到匹配结果。</div></td></tr>`}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="timeline" style="margin-top:12px">
            ${items.map((u) => updateCard(u, app.favorites.has(u.id))).join("") || `<div class="muted">未检索到匹配结果。</div>`}
          </div>
        `}

        <div class="muted" style="margin-top:10px">共 <b>${items.length}</b> 条记录。</div>
      </div>
    </div>
  `;

  return {
    key: "updates",
    title: "政策动态监测",
    crumbs: [{ label: "政策动态监测" }],
    html,
    init: () => {
      const form = document.getElementById("updateFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        params.set("view", view);
        for (const [k, v] of fd.entries()) {
          const s = String(v||"").trim();
          if (s && !(k==="minImp" && s==="0")) params.set(k, s);
        }
        location.hash = `#/updates?${params.toString()}`;
      });
    },
  };
}

export function renderUpdateDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const u = data.updates.find((x) => x.id === id);
  if (!u) {
    return {
      key: "update-detail",
      title: "未找到",
      crumbs: [{ label: "政策动态监测", href: "#/updates" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该动态</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const rel = (u.related || [])
    .map((rid) => {
      if (rid.startsWith("CASE-")) {
        const c = data.cases.find((x) => x.id === rid);
        return c ? pillLink(`#/cases/${encodeURIComponent(c.id)}`, c.titleCn || c.title) : "";
      }
      if (rid.startsWith("DOC-")) {
        const d = data.documents.find((x) => x.id === rid);
        return d ? pillLink(`#/cooperation/${encodeURIComponent(d.id)}`, d.titleCn || d.title) : "";
      }
      if (rid.startsWith("LAW-")) {
        const l = data.laws.find((x) => x.id === rid);
        return l ? pillLink(`#/laws/${encodeURIComponent(l.id)}`, l.nameCn || l.nameEn) : "";
      }
      if (rid.startsWith("AG-")) {
        const a = data.agencies.find((x) => x.id === rid);
        return a ? pillLink(`#/agencies/${encodeURIComponent(a.id)}`, a.nameCn || a.nameEn) : "";
      }
      return "";
    })
    .filter(Boolean);

  const tags = (u.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(u.titleCn || u.title)}</div>
          <div class="card-desc">${escapeHtml(u.title)}</div>
        </div>
        <div class="row-actions">
          ${favButton(u.id, app.favorites.has(u.id))}
          ${externalLink(u.sourceUrl, "打开原文")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "元数据",
              `<div class="kv">
                <div class="k">日期</div><div class="v">${escapeHtml(formatDate(u.date))}</div>
                <div class="k">来源</div><div class="v">${escapeHtml(u.jurisdictionOrOrg)}</div>
                <div class="k">类型</div><div class="v"><span class="badge">${escapeHtml(u.type)}</span></div>
                <div class="k">重要性</div><div class="v">${importanceBadge(u.importance)}</div>
                <div class="k">语言</div><div class="v"><span class="badge">${escapeHtml(u.language)}</span></div>
                <div class="k">翻译</div><div class="v"><span class="badge">${u.translated ? "已翻译" : "未翻译"}</span></div>
              </div>`
            )}

            ${section("摘要", `<div class="prose">${escapeHtml(u.summaryCn)}</div>`)}
          </div>
          <div>
            ${section("标签", `<div class="pill-links">${tags || `<span class="muted">—</span>`}</div>`)}
            ${section("关联条目", rel.length ? pills(rel) : `<div class="muted">—</div>`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "update-detail",
    title: "动态详情",
    crumbs: [{ label: "政策动态监测", href: "#/updates" }, { label: u.titleCn || u.title }],
    html,
  };
}
