import { escapeHtml, formatDate, normalize, yearOf, uniq } from "../lib/strings.js";
import { badge, externalLink, favButton, pillLink, pills, section } from "../components.js";

function lawRow(l, isFav) {
  return `<tr>
    <td>
      <a class="row-title" href="#/laws/${encodeURIComponent(l.id)}">${escapeHtml(l.nameCn || l.nameEn)}</a>
      <div class="row-sub">${escapeHtml(l.nameEn)}</div>
    </td>
    <td><span class="badge">${escapeHtml(l.jurisdiction)}</span></td>
    <td>${escapeHtml(l.type)}</td>
    <td>${escapeHtml(formatDate(l.adoptedDate))}</td>
    <td>
      <div class="row-actions">
        ${favButton(l.id, isFav)}
        ${externalLink(l.sourceUrl, "原文")}
      </div>
    </td>
  </tr>`;
}

function optionVals(values, selected) {
  return values
    .map((v) => `<option value="${escapeHtml(v)}" ${selected === v ? "selected" : ""}>${escapeHtml(v)}</option>`)
    .join("");
}

export function renderLawsList(ctx) {
  const { data, route, app } = ctx;
  const q = route.query.q || "";
  const jurisdiction = route.query.jurisdiction || "";
  const type = route.query.type || "";
  const topic = route.query.topic || "";

  let items = [...data.laws];
  const nq = normalize(q);
  if (nq) {
    items = items.filter((l) =>
      normalize(`${l.nameCn} ${l.nameEn} ${l.summaryCn} ${(l.keyTopics||[]).join(" ")}`).includes(nq)
    );
  }
  if (jurisdiction) items = items.filter((l) => l.jurisdiction === jurisdiction);
  if (type) items = items.filter((l) => l.type === type);
  if (topic) items = items.filter((l) => (l.keyTopics || []).includes(topic));

  items.sort((a, b) => String(b.adoptedDate).localeCompare(String(a.adoptedDate)));

  const typeOptions = uniq(data.laws.map((l) => l.type)).sort();
  const topicOptions = uniq(data.laws.flatMap((l) => l.keyTopics || [])).sort();

  const jurisdictions = data.jurisdictions
    .filter((j) => j.code !== "CN")
    .map((j) => `<option value="${escapeHtml(j.code)}" ${jurisdiction === j.code ? "selected" : ""}>${escapeHtml(j.nameCn)} (${escapeHtml(j.code)})</option>`)
    .join("");

  const rows = items.map((l) => lawRow(l, app.favorites.has(l.id))).join("");

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">域外法律法规库</div>
          <div class="card-desc">按辖区浏览、按类型筛选、全文（元数据字段）检索；可跳转关联案例与机构。</div>
        </div>
        <div class="row-actions">
          <button class="btn" data-action="export-csv" data-scope="laws">导出 CSV</button>
          <button class="btn" data-action="export-xls" data-scope="laws">导出 Excel</button>
        </div>
      </div>
      <div class="card-body">
        <form class="filters" id="lawFilters">
          <div class="field">
            <label>关键词</label>
            <input name="q" value="${escapeHtml(q)}" placeholder="法名称 / 摘要 / 主题词…" />
          </div>
          <div class="field">
            <label>辖区</label>
            <select name="jurisdiction">
              <option value="">全部</option>
              ${jurisdictions}
            </select>
          </div>
          <div class="field">
            <label>类型</label>
            <select name="type">
              <option value="">全部</option>
              ${optionVals(typeOptions, type)}
            </select>
          </div>
          <div class="field">
            <label>主题词</label>
            <select name="topic">
              <option value="">全部</option>
              ${optionVals(topicOptions, topic)}
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
                <th>法律法规</th>
                <th>辖区</th>
                <th>类型</th>
                <th>通过/发布</th>
                <th style="width: 170px">操作</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="5"><div class="muted">未检索到匹配结果。</div></td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="muted" style="margin-top: 10px">
          共 <b>${items.length}</b> 条记录 · 生产版可补充：条文结构化解析、修订沿革、翻译对照、关联判例与指南。
        </div>
      </div>
    </div>
  `;

  return {
    key: "laws",
    title: "域外法律法规库",
    crumbs: [{ label: "域外法律法规库" }],
    html,
    init: () => {
      const form = document.getElementById("lawFilters");
      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) {
          const s = String(v || "").trim();
          if (s) params.set(k, s);
        }
        location.hash = `#/laws?${params.toString()}`;
      });
    },
    export: {
      scope: "laws",
      columns: [
        { key: "id", header: "id" },
        { key: "jurisdiction", header: "jurisdiction" },
        { key: "type", header: "type" },
        { key: "level", header: "level" },
        { key: "nameCn", header: "nameCn" },
        { key: "nameEn", header: "nameEn" },
        { key: "adoptedDate", header: "adoptedDate" },
        { key: "sourceUrl", header: "sourceUrl" },
      ],
      rows: items.map((l) => ({
        id: l.id,
        jurisdiction: l.jurisdiction,
        type: l.type,
        level: l.level,
        nameCn: l.nameCn,
        nameEn: l.nameEn,
        adoptedDate: l.adoptedDate,
        sourceUrl: l.sourceUrl,
      })),
    },
  };
}

export function renderLawDetail(ctx) {
  const { data, route, app } = ctx;
  const id = route.parts[1];
  const law = data.laws.find((l) => l.id === id);
  if (!law) {
    return {
      key: "law-detail",
      title: "未找到",
      crumbs: [{ label: "域外法律法规库", href: "#/laws" }, { label: "未找到" }],
      html: `<div class="card pad"><div class="card-title">未找到该法律法规</div><div class="card-desc">请检查链接或返回列表页。</div></div>`,
    };
  }

  const jur = data.jurisdictions.find((j) => j.code === law.jurisdiction);

  const relatedCases = data.cases
    .filter((c) => (c.relatedLaws || []).includes(law.id))
    .slice(0, 10)
    .map((c) => pillLink(`#/cases/${encodeURIComponent(c.id)}`, c.titleCn || c.title));

  const html = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(law.nameCn || law.nameEn)}</div>
          <div class="card-desc">${escapeHtml(law.nameEn)}</div>
        </div>
        <div class="row-actions">
          ${favButton(law.id, app.favorites.has(law.id))}
          ${externalLink(law.sourceUrl, "打开原文")}
        </div>
      </div>
      <div class="card-body">
        <div class="grid cols-2">
          <div>
            ${section(
              "元数据",
              `<div class="kv">
                <div class="k">辖区</div><div class="v">${escapeHtml(jur?.nameCn || law.jurisdiction)} (${escapeHtml(law.jurisdiction)})</div>
                <div class="k">类型</div><div class="v"><span class="badge">${escapeHtml(law.type)}</span></div>
                <div class="k">层级</div><div class="v">${escapeHtml(law.level)}</div>
                <div class="k">通过/发布</div><div class="v">${escapeHtml(formatDate(law.adoptedDate))}</div>
                <div class="k">修订情况</div><div class="v">${escapeHtml(law.lastAmendedDate || "—")}</div>
                <div class="k">制定机关</div><div class="v">${escapeHtml(law.issuingBody)}</div>
                <div class="k">中文材料</div><div class="v"><span class="badge">${escapeHtml(law.translation?.zh || "—")}</span></div>
                <div class="k">来源</div><div class="v">${escapeHtml(law.sourceName)}</div>
              </div>`
            )}

            ${section(
              "主题词",
              `<div class="pill-links">${(law.keyTopics || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("")}</div>`
            )}
          </div>

          <div>
            ${section("摘要", `<div class="prose">${escapeHtml(law.summaryCn)}</div>`)}
            ${section(
              "关联案例",
              relatedCases.length
                ? pills(relatedCases)
                : `<div class="muted">该条目在示例数据中暂无关联案例（生产版可通过规则库自动关联）。</div>`
            )}
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    key: "law-detail",
    title: "法律法规详情",
    crumbs: [{ label: "域外法律法规库", href: "#/laws" }, { label: law.nameCn || law.nameEn }],
    html,
  };
}
