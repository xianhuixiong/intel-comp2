import { escapeHtml, formatDate, normalize, yearOf } from "../lib/strings.js";
import { badge, externalLink, favButton, pillLink, pills, section } from "../components.js";

function buildFilterOptions(data, key, labelFn = (x) => x) {
  const vals = Array.from(new Set(data.map((d) => d[key]).filter(Boolean))).sort();
  return vals.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(labelFn(v))}</option>`).join("");
}

function docRow(d, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/cooperation/${encodeURIComponent(d.id)}">${escapeHtml(d.titleCn || d.title)}</a>
      <div class="row-sub">${escapeHtml(d.title)}</div>
      <div class="row-sub">${escapeHtml(d.parties.join(" / "))}</div>
    </td>
    <td>${badge(d.category, d.category)}</td>
    <td><span class="badge">${escapeHtml(d.type)}</span></td>
    <td>${escapeHtml(formatDate(d.signedDate))}</td>
    <td>
      <div class="row-actions">
        ${favButton(d.id, isFav)}
        ${externalLink(d.sourceUrl, "原文")}
      </div>
    </td>
  </tr>`;
}

export function renderCooperationList(ctx) {
  const { data, route, app } = ctx;
  const q = route.query.q || "";
  const category = route.query.category || "";
  const type = route.query.type || "";
  const jurisdiction = route.query.jurisdiction || "";
  const org = route.query.org || "";
  const yearFrom = route.query.from || "";
  const yearTo = route.query.to || "";

  let items = [...data.documents];

  const nq = normalize(q);
  if (nq) {
    items = items.filter((d) => normalize(`${d.title} ${d.titleCn} ${d.summaryCn} ${d.parties.join(" ")} ${(d.tags||[]).join(" ")}`).includes(nq));
  }
  if (category) items = items.filter((d) => d.category === category);
  if (type) items = items.filter((d) => d.type === type);
  if (jurisdiction) items = items.filter((d) => (d.relatedJurisdictions || []).includes(jurisdiction));
  if (org) items = items.filter((d) => (d.relatedOrgs || []).includes(org));
  if (yearFrom) items = items.filter((d) => Number(yearOf(d.signedDate)) >= Number(yearFrom));
  if (yearTo) items = items.filter((d) => Number(yearOf(d.signedDate)) <= Number(yearTo));

  items.sort((a, b) => String(b.signedDate).localeCompare(String(a.signedDate)));

  const rows = items.map((d) => docRow(d, app.favorites.has(d.id))).join("");

  const jurisdictions = data.jurisdictions
    .filter((j) => j.code !== "CN")
    .map((j) => `<option value="${escapeHtml(j.code)}">${escapeHtml(j.nameCn)} (${escapeHtml(j.code)})</option>`)
    .join("");

  const orgOptions = data.organizations
    .map((o) => `<option value="${escapeHtml(o.id)}">${escapeHtml(o.abbrev)} · ${escapeHtml(o.nameCn)}</option>`)
    .join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">国际合作法律文件库</div>
          <div class="card-desc">多维度检索：协议类别 / 文件类型 / 涉及辖区 / 国际组织 / 时间范围 / 关键词（示例数据）。</div>
        </div>
        <div class="row-actions">
          <button class="btn" data-action="export-csv" data-scope="cooperation">导出 CSV</button>
          <button class="btn" data-action="export-xls" data-scope="cooperation">导出 Excel</button>
        </div>
      </div>
      <div class="card-body">
        <form class="filters" id="coopFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="标题 / 摘要 / 当事方 / 标签…" />
          </div>
          <div class="field">
            <label>类别</label>
            <select name="category">
              <option value="">全部</option>
              <option value="Bilateral" ${category === "Bilateral" ? "selected" : ""}>Bilateral（双边）</option>
              <option value="FTA" ${category === "FTA" ? "selected" : ""}>FTA（自贸协定）</option>
              <option value="Multilateral" ${category === "Multilateral" ? "selected" : ""}>Multilateral（多边）</option>
            </select>
          </div>
          <div class="field">
            <label>文件类型</label>
            <select name="type">
              <option value="">全部</option>
              ${buildFilterOptions(data.documents, "type")}
            </select>
          </div>
          <div class="field">
            <label>涉及辖区</label>
            <select name="jurisdiction">
              <option value="">全部</option>
              ${jurisdictions}
            </select>
          </div>
          <div class="field">
            <label>国际组织</label>
            <select name="org">
              <option value="">全部</option>
              ${orgOptions}
            </select>
          </div>
          <div class="field">
            <label>签署年份（起）</label>
            <input name="from" value="${escapeHtml(yearFrom)}" placeholder="例如 1990" />
          </div>
          <div class="field">
            <label>签署年份（止）</label>
            <input name="to" value="${escapeHtml(yearTo)}" placeholder="例如 2025" />
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">应用筛选</button>
          </div>
        </form>

        <div class="table-wrap" style="margin-top: 12px">
          <table class="table">
            <thead>
              <tr>
                <th>文件</th>
                <th>类别</th>
                <th>类型</th>
                <th>签署/发布</th>
                <th style="width: 170px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="5"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="muted" style="margin-top: 10px">
          共 <b>${items.length}</b> 条记录 · 列表可导出并用于后续材料归档（生产版可对接全文检索与审校流程）。
        </div>
      </div>
    </div>
  `;

  return {
    key: "cooperation",
    title: "国际合作法律文件库",
    crumbs: [{ label: "国际合作法律文件库" }],
    html,
    init: () => {
      const form = document.getElementById("coopFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v || "").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/cooperation?${params.toString()}`;
      });

      // set selected values after dynamic options
      const typeSel = form?.querySelector('select[name="type"]');
      if (typeSel) typeSel.value = type;
      const jurSel = form?.querySelector('select[name="jurisdiction"]');
      if (jurSel) jurSel.value = jurisdiction;
      const orgSel = form?.querySelector('select[name="org"]');
      if (orgSel) orgSel.value = org;
    },
    export: {
      scope: "cooperation",
      columns: [
        { key: "title", header: "title" },
        { key: "titleCn", header: "titleCn" },
        { key: "category", header: "category" },
        { key: "type", header: "type" },
        { key: "parties", header: "parties" },
        { key: "signedDate", header: "signedDate" },
        { key: "sourceUrl", header: "sourceUrl" },
      ],
      rows: items.map((d) => ({
        title: d.title,
        titleCn: d.titleCn,
        category: d.category,
        type: d.type,
        parties: d.parties.join(" | "),
        signedDate: d.signedDate,
        sourceUrl: d.sourceUrl,
      })),
    },
  };
}

export function renderCooperationDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const doc = data.documents.find((d) => d.id === id);
  if (!doc) {
    return {
      key: "cooperation-detail",
      title: "未找到",
      crumbs: [{ label: "国际合作法律文件库", href: "#/cooperation" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该文件</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const relJ = (doc.relatedJurisdictions || [])
    .map((code) => {
      const j = data.jurisdictions.find((x) => x.code === code);
      return j ? pillLink(`#/laws?jurisdiction=${encodeURIComponent(code)}`, `${j.nameCn} (${code})`) : "";
    })
    .filter(Boolean);

  const relO = (doc.relatedOrgs || [])
    .map((oid) => {
      const o = data.organizations.find((x) => x.id === oid);
      return o ? pillLink(`#/agencies/org/${encodeURIComponent(oid)}`, `${o.abbrev}`) : "";
    })
    .filter(Boolean);

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(doc.titleCn || doc.title)}</div>
          <div class="card-desc">${escapeHtml(doc.title)}</div>
        </div>
        <div class="row-actions">
          ${favButton(doc.id, app.favorites.has(doc.id))}
          ${externalLink(doc.sourceUrl, "打开原文")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "基本信息",
              `<div class="kv">
                <div class="k">类别</div><div class="v">${badge(doc.category, doc.category)}</div>
                <div class="k">文件类型</div><div class="v"><span class="badge">${escapeHtml(doc.type)}</span></div>
                <div class="k">当事方</div><div class="v">${escapeHtml(doc.parties.join(" / "))}</div>
                <div class="k">签署/发布</div><div class="v">${escapeHtml(formatDate(doc.signedDate))}</div>
                <div class="k">生效/适用</div><div class="v">${escapeHtml(formatDate(doc.inForceDate))}</div>
                <div class="k">语言</div><div class="v">${escapeHtml(doc.language)}</div>
                <div class="k">中文材料</div><div class="v"><span class="badge">${escapeHtml(doc.translation?.zh || "—")}</span></div>
                <div class="k">来源</div><div class="v">${escapeHtml(doc.sourceName)}</div>
              </div>`
            )}

            ${section(
              "中文要点（示例结构）",
              `<ul class="ul">${(doc.keyPointsCn || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
            )}
          </div>

          <div>
            ${section(
              "摘要",
              `<div class="prose">${escapeHtml(doc.summaryCn)}</div>`
            )}

            ${section(
              "标签",
              `<div class="pill-links">${(doc.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("")}</div>`
            )}

            ${section(
              "原文与备选链接",
              `<div class="pill-links">
                <a class="pill" href="${escapeHtml(doc.sourceUrl)}" target="_blank" rel="noopener">主链接 ↗</a>
                ${(doc.alternateUrls || [])
                  .map((u) => `<a class="pill" href="${escapeHtml(u)}" target="_blank" rel="noopener">备选链接 ↗</a>`)
                  .join("")}
              </div>`
            )}

            ${section("关联跳转", `<div class="muted" style="margin-bottom:6px">涉及辖区</div>${pills(relJ)}<div style="height:10px"></div><div class="muted" style="margin-bottom:6px">相关国际组织</div>${pills(relO)}`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "cooperation-detail",
    title: "合作文件详情",
    crumbs: [{ label: "国际合作法律文件库", href: "#/cooperation" }, { label: doc.titleCn || doc.title }],
    html,
  };
}
