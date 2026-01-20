import { escapeHtml, formatDate, normalize, uniq } from "../lib/strings.js";
import { externalLink, favButton, pillLink, pills, section } from "../components.js";

function resRow(r, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/research/${encodeURIComponent(r.id)}">${escapeHtml(r.titleCn || r.title)}</a>
      <div class="row-sub">${escapeHtml(r.publisher)} · ${escapeHtml(formatDate(r.publishDate))} · ${escapeHtml(r.type)}</div>
    </td>
    <td>${escapeHtml(r.language)}</td>
    <td>${r.translated ? `<span class="badge success">已译</span>` : `<span class="badge">未译</span>`}</td>
    <td>
      <div class="row-actions">
        ${favButton(r.id, isFav)}
        ${externalLink(r.sourceUrl, "原文")}
      </div>
    </td>
  </tr>`;
}

function optionVals(values, selected) {
  return values
    .map((v) => `<option value="${escapeHtml(v)}" ${selected === v ? "selected" : ""}>${escapeHtml(v)}</option>`)
    .join("");
}

export function renderResearchList(ctx) {
  const { data, route, app } = ctx;
  const q = route.query.q || "";
  const type = route.query.type || "";
  const publisher = route.query.publisher || "";
  const tag = route.query.tag || "";

  let items = [...data.research];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((r) => normalize(`${r.title} ${r.titleCn} ${r.publisher} ${r.summaryCn} ${(r.tags||[]).join(" ")}`).includes(nq));
  }
  if (type) items = items.filter((r) => r.type === type);
  if (publisher) items = items.filter((r) => r.publisher === publisher);
  if (tag) items = items.filter((r) => (r.tags || []).includes(tag));

  items.sort((a, b) => String(b.publishDate).localeCompare(String(a.publishDate)));

  const typeOptions = uniq(data.research.map((r) => r.type)).sort();
  const publisherOptions = uniq(data.research.map((r) => r.publisher)).sort();
  const tagOptions = uniq(data.research.flatMap((r) => r.tags || [])).sort();

  const tabs = pills([
    pillLink("#/research", "研究报告"),
    pillLink("#/research/glossary", "术语库"),
  ]);

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">专题研究与参考</div>
          <div class="card-desc">收集、翻译研究报告与工具包，并沉淀术语库与引用规范（示例）。</div>
        </div>
        <div class="right">${tabs}</div>
      </div>
      <div class="card-body">
        <form class="filters" id="researchFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="标题 / 发布机构 / 摘要 / 标签…" />
          </div>
          <div class="field">
            <label>类型</label>
            <select name="type">
              <option value="">全部</option>
              ${optionVals(typeOptions, type)}
            </select>
          </div>
          <div class="field">
            <label>发布机构</label>
            <select name="publisher">
              <option value="">全部</option>
              ${optionVals(publisherOptions, publisher)}
            </select>
          </div>
          <div class="field">
            <label>标签</label>
            <select name="tag">
              <option value="">全部</option>
              ${optionVals(tagOptions, tag)}
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
                <th>研究报告 / 工具包</th>
                <th style="width:120px">语言</th>
                <th style="width:90px">翻译</th>
                <th style="width:180px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((r) => resRow(r, app.favorites.has(r.id))).join("") || `<tr><td colspan="4"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="muted" style="margin-top:10px">共 <b>${items.length}</b> 条记录。</div>
      </div>
    </div>
  `;

  return {
    key: "research",
    title: "专题研究与参考",
    crumbs: [{ label: "专题研究与参考" }],
    html,
    init: () => {
      const form = document.getElementById("researchFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v||"").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/research?${params.toString()}`;
      });
    },
  };
}

export function renderResearchDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const r = data.research.find((x) => x.id === id);
  if (!r) {
    return {
      key: "research-detail",
      title: "未找到",
      crumbs: [{ label: "专题研究与参考", href: "#/research" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该条目</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const tags = (r.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");

  const relCases = data.cases
    .filter((c) => (c.tags || []).some((t) => (r.tags || []).includes(t)))
    .slice(0, 8)
    .map((c) => pillLink(`#/cases/${encodeURIComponent(c.id)}`, c.titleCn || c.title));

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(r.titleCn || r.title)}</div>
          <div class="card-desc">${escapeHtml(r.title)} · ${escapeHtml(r.publisher)} · ${escapeHtml(formatDate(r.publishDate))}</div>
        </div>
        <div class="row-actions">
          ${favButton(r.id, app.favorites.has(r.id))}
          ${externalLink(r.sourceUrl, "打开原文")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "元数据",
              `<div class="kv">
                <div class="k">发布机构</div><div class="v">${escapeHtml(r.publisher)}</div>
                <div class="k">发布日期</div><div class="v">${escapeHtml(formatDate(r.publishDate))}</div>
                <div class="k">类型</div><div class="v"><span class="badge">${escapeHtml(r.type)}</span></div>
                <div class="k">语言</div><div class="v"><span class="badge">${escapeHtml(r.language)}</span></div>
                <div class="k">翻译</div><div class="v"><span class="badge ${r.translated ? "success" : ""}">${r.translated ? "已翻译" : "未翻译"}</span></div>
                <div class="k">来源</div><div class="v">${escapeHtml(r.sourceName)}</div>
              </div>`
            )}
            ${section("摘要", `<div class="prose">${escapeHtml(r.summaryCn)}</div>`)}
          </div>
          <div>
            ${section("标签", `<div class="pill-links">${tags || `<span class="muted">—</span>`}</div>`)}
            ${section("相关案例（按标签匹配）", relCases.length ? pills(relCases) : `<div class="muted">—</div>`)}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "research-detail",
    title: "研究条目详情",
    crumbs: [{ label: "专题研究与参考", href: "#/research" }, { label: r.titleCn || r.title }],
    html,
  };
}

export function renderGlossary(ctx) {
  const { data, route } = ctx;
  const term = route.query.term || "";
  const q = route.query.q || term;

  let items = [...data.glossary];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((g) => normalize(`${g.term} ${g.termEn} ${g.definitionCn} ${(g.tags||[]).join(" ")}`).includes(nq));
  }
  items.sort((a, b) => a.term.localeCompare(b.term));

  const tabs = pills([
    pillLink("#/research", "研究报告"),
    pillLink("#/research/glossary", "术语库"),
  ]);

  const rows = items
    .map(
      (g) => `<tr>
        <td><div class="row-title">${escapeHtml(g.term)}</div><div class="row-sub">${escapeHtml(g.termEn || "")}</div></td>
        <td><div class="prose">${escapeHtml(g.definitionCn)}</div></td>
        <td>${(g.tags||[]).map((t)=>`<span class="pill">${escapeHtml(t)}</span>`).join("")}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">术语库</div>
          <div class="card-desc">统一术语译名与定义，用于翻译一致性、摘要模板化与跨模块检索。</div>
        </div>
        <div class="right">${tabs}</div>
      </div>
      <div class="card-body">
        <form class="filters" id="glossaryFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="术语 / 英文 / 定义…" />
          </div>
          <div class="field" style="align-self:end">
            <button class="btn btn-primary" type="submit">检索</button>
          </div>
        </form>

        <div class="table-wrap" style="margin-top:12px">
          <table class="table">
            <thead>
              <tr>
                <th style="width:240px">术语</th>
                <th>定义</th>
                <th style="width:240px">标签</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="3"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="muted" style="margin-top:10px">共 <b>${items.length}</b> 条。</div>
      </div>
    </div>
  `;

  return {
    key: "glossary",
    title: "术语库",
    crumbs: [{ label: "专题研究与参考", href: "#/research" }, { label: "术语库" }],
    html,
    init: () => {
      const form = document.getElementById("glossaryFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v||"").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/research/glossary?${params.toString()}`;
      });
    },
  };
}
