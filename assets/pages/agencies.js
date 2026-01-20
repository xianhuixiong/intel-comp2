import { escapeHtml, normalize, uniq } from "../lib/strings.js";
import { badge, externalLink, favButton, pillLink, pills, section } from "../components.js";
import { chartCard, drawBarChart } from "../lib/charts.js";
import { renderNetwork } from "../lib/network.js";

function agencyRow(a, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/agencies/${encodeURIComponent(a.id)}">${escapeHtml(a.nameCn || a.nameEn)}</a>
      <div class="row-sub">${escapeHtml(a.nameEn)}</div>
    </td>
    <td><span class="badge">${escapeHtml(a.jurisdiction)}</span></td>
    <td>${escapeHtml(a.abbrev)}</td>
    <td>${escapeHtml(a.type)}</td>
    <td>
      <div class="row-actions">
        ${favButton(a.id, isFav)}
        ${externalLink(a.website, "官网")}
      </div>
    </td>
  </tr>`;
}

function orgRow(o, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/agencies/org/${encodeURIComponent(o.id)}">${escapeHtml(o.nameCn || o.nameEn)}</a>
      <div class="row-sub">${escapeHtml(o.nameEn)}</div>
    </td>
    <td>${escapeHtml(o.abbrev)}</td>
    <td>${escapeHtml(o.type)}</td>
    <td>
      <div class="row-actions">
        ${favButton(o.id, isFav)}
        ${externalLink(o.website, "官网")}
      </div>
    </td>
  </tr>`;
}

export function renderAgenciesList(ctx) {
  const { data, route, app } = ctx;
  const view = route.query.view || "agencies"; // agencies | orgs
  const q = route.query.q || "";
  const jurisdiction = route.query.jurisdiction || "";

  const tabs = pills([
    pillLink("#/agencies?view=agencies", "执法机构"),
    pillLink("#/agencies?view=orgs", "国际组织"),
    pillLink("#/agencies/network", "合作网络"),
  ]);

  if (view === "orgs") {
    let items = [...data.organizations];
    const nq = normalize(q);
    if (nq) {
      items = items.filter((o) => normalize(`${o.nameCn} ${o.nameEn} ${o.overviewCn} ${(o.keyMechanismsCn||[]).join(" ")}`).includes(nq));
    }
    items.sort((a, b) => a.abbrev.localeCompare(b.abbrev));

    const html = `
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">执法机构信息库</div>
            <div class="card-desc">国际组织（OECD、APEC、UNCTAD、ICN 等）竞争领域合作基本情况（示例）。</div>
          </div>
          <div class="right">${tabs}</div>
        </div>
        <div class="card-body">
          <form class="filters" id="orgFilters">
            <div class="field">
              <label>关键词</label>
              <input name="q" value="${escapeHtml(q)}" placeholder="组织名称 / 概述 / 机制…" />
            </div>
            <div class="field" style="align-self:end">
              <button class="btn btn-primary" type="submit">检索</button>
            </div>
          </form>

          <div class="table-wrap" style="margin-top: 12px">
            <table class="table">
              <thead>
                <tr>
                  <th>国际组织</th>
                  <th>缩写</th>
                  <th>类型</th>
                  <th style="width: 180px">操作</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((o) => orgRow(o, app.favorites.has(o.id))).join("") || `<tr><td colspan="4"><div class="muted">未检索到匹配结果。</div></td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    return {
      key: "agencies-orgs",
      title: "执法机构信息库",
      crumbs: [{ label: "执法机构信息库" }, { label: "国际组织" }],
      html,
      init: () => {
        const form = document.getElementById("orgFilters");
        form?.addEventListener("submit", (ev) => {
          ev.preventDefault();
          const fd = new FormData(form);
          const params = new URLSearchParams();
          params.set("view", "orgs");
          for (const [k, v] of fd.entries()) {
            const s = String(v || "").trim();
            if (s) params.set(k, s);
          }
          location.hash = `#/agencies?${params.toString()}`;
        });
      },
    };
  }

  // default: agencies list
  let items = [...data.agencies];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((a) => normalize(`${a.nameCn} ${a.nameEn} ${a.abbrev} ${a.mandateCn}`).includes(nq));
  }
  if (jurisdiction) items = items.filter((a) => a.jurisdiction === jurisdiction);
  items.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || a.abbrev.localeCompare(b.abbrev));

  const jurOptions = data.jurisdictions
    .filter((j) => j.code !== "CN")
    .map((j) => `<option value="${escapeHtml(j.code)}" ${jurisdiction === j.code ? "selected" : ""}>${escapeHtml(j.nameCn)} (${escapeHtml(j.code)})</option>`)
    .join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">执法机构信息库</div>
          <div class="card-desc">域外主要司法辖区反垄断执法机构信息（含职责、合作机制、关联文件/案例）。</div>
        </div>
        <div class="right">${tabs}</div>
      </div>
      <div class="card-body">
        <form class="filters" id="agencyFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="机构名称 / 缩写 / 职责…" />
          </div>
          <div class="field">
            <label>辖区</label>
            <select name="jurisdiction">
              <option value="">全部</option>
              ${jurOptions}
            </select>
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">应用筛选</button>
          </div>
        </form>

        <div class="table-wrap" style="margin-top: 12px">
          <table class="table">
            <thead>
              <tr>
                <th>机构</th>
                <th>辖区</th>
                <th>缩写</th>
                <th>类型</th>
                <th style="width: 180px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((a) => agencyRow(a, app.favorites.has(a.id))).join("") || `<tr><td colspan="5"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return {
    key: "agencies",
    title: "执法机构信息库",
    crumbs: [{ label: "执法机构信息库" }],
    html,
    init: () => {
      const form = document.getElementById("agencyFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v || "").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/agencies?${params.toString()}`;
      });
    },
  };
}

export function renderAgencyDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const ag = data.agencies.find((x) => x.id === id);
  if (!ag) {
    return {
      key: "agency-detail",
      title: "未找到",
      crumbs: [{ label: "执法机构信息库", href: "#/agencies" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该机构</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const jur = data.jurisdictions.find((j) => j.code === ag.jurisdiction);

  const relDocs = (ag.cooperation?.relatedDocs || [])
    .map((did) => {
      const d = data.documents.find((x) => x.id === did);
      return d ? pillLink(`#/cooperation/${encodeURIComponent(did)}`, d.titleCn || d.title) : "";
    })
    .filter(Boolean);

  const relOrgs = (ag.cooperation?.relatedOrgs || [])
    .map((oid) => {
      const o = data.organizations.find((x) => x.id === oid);
      return o ? pillLink(`#/agencies/org/${encodeURIComponent(oid)}`, `${o.abbrev}`) : "";
    })
    .filter(Boolean);

  const relCases = data.cases
    .filter((c) => (c.relatedAgencies || []).includes(ag.id))
    .map((c) => pillLink(`#/cases/${encodeURIComponent(c.id)}`, c.titleCn || c.title));

  // Analytics (derived): case sectors distribution for this agency (within demo dataset)
  const bySector = new Map();
  for (const c of data.cases) {
    if (!(c.relatedAgencies || []).includes(ag.id)) continue;
    bySector.set(c.sector, (bySector.get(c.sector) || 0) + 1);
  }
  const sectorLabels = Array.from(bySector.keys());
  const sectorValues = sectorLabels.map((k) => bySector.get(k));

  const chart = sectorLabels.length
    ? chartCard({
        title: "执法案件结构（示例数据）",
        desc: "按行业/领域统计本库已收录案例（并非该机构全量执法统计）。",
        canvasId: "agencyChart",
        height: 240,
      })
    : `<div class="card pad"><div class="card-title">执法案件结构</div><div class="card-desc">示例数据暂无关联案例。</div></div>`;

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(ag.nameCn || ag.nameEn)}</div>
          <div class="card-desc">${escapeHtml(ag.nameEn)} · ${escapeHtml(ag.abbrev)}</div>
        </div>
        <div class="row-actions">
          ${favButton(ag.id, app.favorites.has(ag.id))}
          ${externalLink(ag.website, "官网")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "基本信息",
              `<div class="kv">
                <div class="k">辖区</div><div class="v">${escapeHtml(jur?.nameCn || ag.jurisdiction)} (${escapeHtml(ag.jurisdiction)})</div>
                <div class="k">缩写</div><div class="v">${escapeHtml(ag.abbrev)}</div>
                <div class="k">类型</div><div class="v"><span class="badge">${escapeHtml(ag.type)}</span></div>
                <div class="k">官网</div><div class="v"><a class="link" href="${escapeHtml(ag.website)}" target="_blank" rel="noopener">${escapeHtml(ag.website)} ↗</a></div>
                <div class="k">地址</div><div class="v">${escapeHtml(ag.contacts?.address || "—")}</div>
              </div>`
            )}

            ${section("职责概述", `<div class="prose">${escapeHtml(ag.mandateCn)}</div>`)}

            ${section(
              "国际合作重点",
              `<ul class="ul">${(ag.cooperation?.focusCn || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
            )}
          </div>

          <div>
            ${chart}

            ${section("相关合作文件", relDocs.length ? pills(relDocs) : `<div class="muted">—</div>`)}

            ${section("相关国际组织", relOrgs.length ? pills(relOrgs) : `<div class="muted">—</div>`)}

            ${section("关联重大案例", relCases.length ? pills(relCases) : `<div class="muted">—</div>`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "agency-detail",
    title: "执法机构详情",
    crumbs: [{ label: "执法机构信息库", href: "#/agencies" }, { label: ag.nameCn || ag.nameEn }],
    html,
    init: () => {
      const canvas = document.getElementById("agencyChart");
      if (canvas && sectorLabels.length) {
        drawBarChart(canvas, {
          labels: sectorLabels,
          values: sectorValues,
          title: "按领域统计（收录案例）",
          yLabel: "数量",
        });
      }
    },
  };
}

export function renderOrgDetail(ctx) {
  const { data, route, app } = ctx;
  const oid = route.parts[2];
  const org = data.organizations.find((o) => o.id === oid);
  if (!org) {
    return {
      key: "org-detail",
      title: "未找到",
      crumbs: [{ label: "执法机构信息库", href: "#/agencies?view=orgs" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该国际组织</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const relDocs = data.documents
    .filter((d) => (d.relatedOrgs || []).includes(org.id))
    .map((d) => pillLink(`#/cooperation/${encodeURIComponent(d.id)}`, d.titleCn || d.title));

  const relAgencies = data.agencies
    .filter((a) => (a.cooperation?.relatedOrgs || []).includes(org.id))
    .map((a) => pillLink(`#/agencies/${encodeURIComponent(a.id)}`, a.nameCn || a.nameEn));

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(org.nameCn || org.nameEn)}</div>
          <div class="card-desc">${escapeHtml(org.nameEn)} · ${escapeHtml(org.abbrev)}</div>
        </div>
        <div class="row-actions">
          ${favButton(org.id, app.favorites.has(org.id))}
          ${externalLink(org.website, "官网")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "基本信息",
              `<div class="kv">
                <div class="k">缩写</div><div class="v">${escapeHtml(org.abbrev)}</div>
                <div class="k">类型</div><div class="v"><span class="badge">${escapeHtml(org.type)}</span></div>
                <div class="k">官网</div><div class="v"><a class="link" href="${escapeHtml(org.website)}" target="_blank" rel="noopener">${escapeHtml(org.website)} ↗</a></div>
              </div>`
            )}
            ${section("概述", `<div class="prose">${escapeHtml(org.overviewCn)}</div>`)}
          </div>
          <div>
            ${section(
              "主要合作机制",
              `<ul class="ul">${(org.keyMechanismsCn || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
            )}
            ${section("关联合作文件", relDocs.length ? pills(relDocs) : `<div class="muted">—</div>`)}
            ${section("相关执法机构", relAgencies.length ? pills(relAgencies) : `<div class="muted">—</div>`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "org-detail",
    title: "国际组织详情",
    crumbs: [{ label: "执法机构信息库", href: "#/agencies?view=orgs" }, { label: org.abbrev }],
    html,
  };
}

export function renderAgenciesNetwork(ctx) {
  const { data } = ctx;

  // Nodes
  const nodes = [];
  const edges = [];

  for (const a of data.agencies) {
    nodes.push({ id: a.id, label: a.abbrev || a.nameCn, kind: "agency", url: `#/agencies/${encodeURIComponent(a.id)}` });
    for (const oid of a.cooperation?.relatedOrgs || []) {
      edges.push({ source: a.id, target: oid, kind: "membership" });
    }
  }

  for (const o of data.organizations) {
    nodes.push({ id: o.id, label: o.abbrev, kind: "org", url: `#/agencies/org/${encodeURIComponent(o.id)}` });
  }

  // Add a subset of docs as graph nodes to show “agreement edges” explicitly.
  const docNodes = data.documents
    .filter((d) => d.category === "Bilateral" || d.category === "FTA")
    .slice(0, 12);

  for (const d of docNodes) {
    const label = d.id.replace("DOC-", "");
    nodes.push({ id: d.id, label, kind: "doc", url: `#/cooperation/${encodeURIComponent(d.id)}` });

    for (const code of d.relatedJurisdictions || []) {
      for (const a of data.agencies.filter((x) => x.jurisdiction === code)) {
        edges.push({ source: a.id, target: d.id, kind: "doc" });
      }
    }

    for (const oid of d.relatedOrgs || []) {
      edges.push({ source: d.id, target: oid, kind: "ref" });
    }
  }

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">合作关系网络图（示例）</div>
          <div class="card-desc">展示“机构—国际组织—合作文件”的关联关系。点击节点可跳转到对应详情页。</div>
        </div>
        <div class="right">
          <div class="pill-links">
            <span class="pill"><span class="dot dot-agency"></span> 执法机构</span>
            <span class="pill"><span class="dot dot-org"></span> 国际组织</span>
            <span class="pill"><span class="dot dot-doc"></span> 合作文件</span>
          </div>
        </div>
      </div>
      <div class="card-body">
        <canvas id="networkCanvas" class="network"></canvas>
        <div class="muted" style="margin-top: 10px">
          说明：该图仅基于本原型收录条目自动生成；生产版可接入全量合作协议库与成员/联系机制数据，并支持按时间维度与主题维度筛选。
        </div>
      </div>
    </div>
  `;

  return {
    key: "agencies-network",
    title: "合作网络",
    crumbs: [{ label: "执法机构信息库", href: "#/agencies" }, { label: "合作网络" }],
    html,
    init: () => {
      const canvas = document.getElementById("networkCanvas");
      if (!canvas) return () => {};
      return renderNetwork(canvas, { nodes, edges });
    },
  };
}
