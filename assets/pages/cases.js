import { escapeHtml, formatDate, normalize, uniq } from "../lib/strings.js";
import { externalLink, favButton, pillLink, pills, section } from "../components.js";

function caseRow(c, isFav, isSelected) {
  return `<tr>
    <td class="cell-check"><input type="checkbox" data-action="compare-toggle" data-id="${escapeHtml(c.id)}" ${isSelected ? "checked" : ""} /></td>
    <td>
      <a class="row-title" href="#/cases/${encodeURIComponent(c.id)}">${escapeHtml(c.titleCn || c.title)}</a>
      <div class="row-sub">${escapeHtml(c.jurisdiction)} · ${escapeHtml(c.authority)} · ${escapeHtml(formatDate(c.decisionDate))}</div>
      <div class="row-sub">${escapeHtml(c.sector)} · ${escapeHtml(c.caseNo)}</div>
    </td>
    <td>${escapeHtml(c.penalty || "—")}</td>
    <td>
      <div class="row-actions">
        ${favButton(c.id, isFav)}
        ${c.keyDocs?.[0]?.url ? externalLink(c.keyDocs[0].url, "材料") : ""}
      </div>
    </td>
  </tr>`;
}

function timelineHtml(events) {
  if (!events?.length) return `<div class="muted">—</div>`;
  return `<div class="mini-timeline">${events
    .map(
      (e) => `
      <div class="mini-item">
        <div class="mini-date">${escapeHtml(formatDate(e.date))}</div>
        <div class="mini-body">
          <div class="mini-label">${escapeHtml(e.label)}</div>
          <div class="mini-note">${escapeHtml(e.noteCn || "")}</div>
          ${e.sourceUrl ? `<div class="mini-link"><a class="link" href="${escapeHtml(e.sourceUrl)}" target="_blank" rel="noopener">来源 ↗</a></div>` : ""}
        </div>
      </div>
    `
    )
    .join("")}</div>`;
}

export function renderCasesList(ctx) {
  const { data, route, app } = ctx;
  const q = route.query.q || "";
  const jurisdiction = route.query.jurisdiction || "";
  const sector = route.query.sector || "";

  let items = [...data.cases];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((c) =>
      normalize(`${c.title} ${c.titleCn} ${c.conductCn} ${c.outcomeCn} ${c.analysisCn} ${c.caseNo} ${(c.tags||[]).join(" ")}`).includes(nq)
    );
  }
  if (jurisdiction) items = items.filter((c) => c.jurisdiction === jurisdiction);
  if (sector) items = items.filter((c) => c.sector === sector);

  items.sort((a, b) => String(b.decisionDate).localeCompare(String(a.decisionDate)));

  const jurOptions = data.jurisdictions
    .filter((j) => j.code !== "CN")
    .map((j) => `<option value="${escapeHtml(j.code)}" ${jurisdiction===j.code?"selected":""}>${escapeHtml(j.nameCn)} (${escapeHtml(j.code)})</option>`)
    .join("");

  const sectorOptions = uniq(data.cases.map((c) => c.sector)).sort();

  const rows = items
    .map((c) => caseRow(c, app.favorites.has(c.id), app.compareSet.has(c.id)))
    .join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">重大案例库</div>
          <div class="card-desc">多维检索、时间线、关键材料、案例对比与关联推荐（示例数据）。</div>
        </div>
        <div class="row-actions">
          <button class="btn" id="compareBtn" ${app.compareSet.size < 2 ? "disabled" : ""}>对比（${app.compareSet.size}）</button>
        </div>
      </div>
      <div class="card-body">
        <form class="filters" id="caseFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="标题 / 行为 / 法律问题 / 标签…" />
          </div>
          <div class="field">
            <label>辖区</label>
            <select name="jurisdiction">
              <option value="">全部</option>
              ${jurOptions}
            </select>
          </div>
          <div class="field">
            <label>领域</label>
            <select name="sector">
              <option value="">全部</option>
              ${sectorOptions.map((s) => `<option value="${escapeHtml(s)}" ${sector===s?"selected":""}>${escapeHtml(s)}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">应用筛选</button>
          </div>
        </form>

        <div class="table-wrap" style="margin-top:12px">
          <table class="table">
            <thead>
              <tr>
                <th style="width:44px"></th>
                <th>案例</th>
                <th style="width:180px">处罚/金额</th>
                <th style="width:180px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="muted" style="margin-top:10px">共 <b>${items.length}</b> 条记录 · 勾选 2 条及以上可对比。</div>
      </div>
    </div>
  `;

  return {
    key: "cases",
    title: "重大案例库",
    crumbs: [{ label: "重大案例库" }],
    html,
    init: () => {
      const form = document.getElementById("caseFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v||"").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/cases?${params.toString()}`;
      });

      const btn = document.getElementById("compareBtn");
      btn?.addEventListener("click", () => {
        const ids = Array.from(app.compareSet);
        if (ids.length < 2) return;
        const qs = new URLSearchParams();
        qs.set("ids", ids.join(","));
        location.hash = `#/cases/compare?${qs.toString()}`;
      });

      // table checkbox handlers
      document.querySelectorAll('input[data-action="compare-toggle"]').forEach((el) => {
        el.addEventListener("change", () => {
          const id = el.getAttribute("data-id");
          if (!id) return;
          if (el.checked) app.compareSet.add(id);
          else app.compareSet.delete(id);
          app.persistCompare();
          // update button label & disabled
          const b = document.getElementById("compareBtn");
          if (b) {
            b.textContent = `对比（${app.compareSet.size}）`;
            b.toggleAttribute("disabled", app.compareSet.size < 2);
          }
        });
      });
    },
  };
}

export function renderCaseDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const c = data.cases.find((x) => x.id === id);
  if (!c) {
    return {
      key: "case-detail",
      title: "未找到",
      crumbs: [{ label: "重大案例库", href: "#/cases" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该案例</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const laws = (c.relatedLaws || [])
    .map((lid) => {
      const l = data.laws.find((x) => x.id === lid);
      return l ? pillLink(`#/laws/${encodeURIComponent(lid)}`, l.nameCn || l.nameEn) : "";
    })
    .filter(Boolean);

  const agencies = (c.relatedAgencies || [])
    .map((aid) => {
      const a = data.agencies.find((x) => x.id === aid);
      return a ? pillLink(`#/agencies/${encodeURIComponent(aid)}`, a.abbrev || a.nameCn) : "";
    })
    .filter(Boolean);

  // Related cases: share jurisdiction or tag
  const rel = data.cases
    .filter((x) => x.id !== c.id)
    .map((x) => {
      const sharedTags = (x.tags || []).filter((t) => (c.tags || []).includes(t)).length;
      const score = (x.jurisdiction === c.jurisdiction ? 2 : 0) + Math.min(2, sharedTags);
      return { x, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => pillLink(`#/cases/${encodeURIComponent(r.x.id)}`, r.x.titleCn || r.x.title));

  const keyDocs = (c.keyDocs || [])
    .map((d) => `<a class="pill" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.label)} ↗</a>`)
    .join("");

  const tags = (c.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(c.titleCn || c.title)}</div>
          <div class="card-desc">${escapeHtml(c.title)} · ${escapeHtml(c.jurisdiction)} · ${escapeHtml(c.authority)}</div>
        </div>
        <div class="row-actions">
          ${favButton(c.id, app.favorites.has(c.id))}
          ${c.keyDocs?.[0]?.url ? externalLink(c.keyDocs[0].url, "打开材料") : ""}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "案件要素",
              `<div class="kv">
                <div class="k">辖区</div><div class="v">${escapeHtml(c.jurisdiction)}</div>
                <div class="k">执法机关</div><div class="v">${escapeHtml(c.authority)}</div>
                <div class="k">决定/立案日期</div><div class="v">${escapeHtml(formatDate(c.decisionDate))}</div>
                <div class="k">案号/编号</div><div class="v">${escapeHtml(c.caseNo || "—")}</div>
                <div class="k">领域</div><div class="v"><span class="badge">${escapeHtml(c.sector)}</span></div>
                <div class="k">处罚/金额</div><div class="v">${escapeHtml(c.penalty || "—")}</div>
              </div>`
            )}

            ${section("行为与问题", `<div class="prose"><b>行为概述：</b>${escapeHtml(c.conductCn)}<br/><br/><b>处理结果：</b>${escapeHtml(c.outcomeCn)}</div>`)}

            ${section("关键材料", `<div class="pill-links">${keyDocs || `<span class="muted">—</span>`}</div>`)}
          </div>

          <div>
            ${section("时间线", timelineHtml(c.timeline))}

            ${section("分析要点（示例结构）", `<div class="prose">${escapeHtml(c.analysisCn)}</div>`)}

            ${section("标签", `<div class="pill-links">${tags || `<span class="muted">—</span>`}</div>`)}

            ${section("关联法律法规", laws.length ? pills(laws) : `<div class="muted">—</div>`)}

            ${section("关联执法机构", agencies.length ? pills(agencies) : `<div class="muted">—</div>`)}

            ${section("相关案例推荐", rel.length ? pills(rel) : `<div class="muted">—</div>`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "case-detail",
    title: "案例详情",
    crumbs: [{ label: "重大案例库", href: "#/cases" }, { label: c.titleCn || c.title }],
    html,
  };
}

export function renderCasesCompare(ctx) {
  const { data, route, app } = ctx;
  const ids = String(route.query.ids || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const selected = ids
    .map((id) => data.cases.find((c) => c.id === id))
    .filter(Boolean);

  if (selected.length < 2) {
    const html = `<div class="card pad"><div class="card-title">案例对比</div><div class="card-desc">请选择至少 2 条案例进行对比。</div><div style="margin-top:12px"><a class="btn" href="#/cases">返回案例库</a></div></div>`;
    return {
      key: "cases-compare",
      title: "案例对比",
      crumbs: [{ label: "重大案例库", href: "#/cases" }, { label: "案例对比" }],
      html,
    };
  }

  const cols = selected.map((c) => `<th>${escapeHtml(c.titleCn || c.title)}</th>`).join("");

  const row = (label, getter) => `<tr><th class="comp-key">${escapeHtml(label)}</th>${selected
    .map((c) => `<td>${getter(c)}</td>`)
    .join("")}</tr>`;

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">案例对比</div>
          <div class="card-desc">横向对比辖区、事实与法律问题、救济与处罚、关键材料与时间线。</div>
        </div>
        <div class="row-actions">
          <a class="btn" href="#/cases">返回</a>
          <button class="btn" id="clearCompare">清空选择</button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-wrap">
          <table class="table compare">
            <thead>
              <tr>
                <th style="width:160px">字段</th>
                ${cols}
              </tr>
            </thead>
            <tbody>
              ${row("辖区", (c) => escapeHtml(c.jurisdiction))}
              ${row("执法机关", (c) => escapeHtml(c.authority))}
              ${row("决定/立案日期", (c) => escapeHtml(formatDate(c.decisionDate)))}
              ${row("案号/编号", (c) => escapeHtml(c.caseNo || "—"))}
              ${row("领域", (c) => `<span class="badge">${escapeHtml(c.sector)}</span>`)}
              ${row("处罚/金额", (c) => escapeHtml(c.penalty || "—"))}
              ${row("行为概述", (c) => `<div class="prose">${escapeHtml(c.conductCn)}</div>`)}
              ${row("处理结果", (c) => `<div class="prose">${escapeHtml(c.outcomeCn)}</div>`)}
              ${row(
                "关键材料",
                (c) =>
                  `<div class="pill-links">${(c.keyDocs || [])
                    .map((d) => `<a class="pill" href="${escapeHtml(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.label)} ↗</a>`)
                    .join("")}</div>`
              )}
              ${row("时间线", (c) => timelineHtml(c.timeline))}
              ${row("分析要点", (c) => `<div class="prose">${escapeHtml(c.analysisCn)}</div>`)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return {
    key: "cases-compare",
    title: "案例对比",
    crumbs: [{ label: "重大案例库", href: "#/cases" }, { label: "案例对比" }],
    html,
    init: () => {
      document.getElementById("clearCompare")?.addEventListener("click", () => {
        app.compareSet.clear();
        app.persistCompare();
        location.hash = "#/cases";
      });
    },
  };
}
