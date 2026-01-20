import { escapeHtml, yearOf, uniq } from "../lib/strings.js";
import { exportCsv, exportExcelHtml } from "../lib/exporter.js";
import { chartCard, drawBarChart } from "../lib/charts.js";
import { section } from "../components.js";

function countBy(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function mapToSortedPairs(m) {
  const pairs = Array.from(m.entries());
  pairs.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  return pairs;
}

export function renderAnalytics(ctx) {
  const { data } = ctx;

  // Charts data (derived from the demo dataset)
  const casesByYear = countBy(data.cases, (c) => yearOf(c.decisionDate));
  const casesByJur = countBy(data.cases, (c) => c.jurisdiction);
  const docsByCat = countBy(data.documents, (d) => d.category);

  const years = Array.from(casesByYear.keys()).sort();
  const yearValues = years.map((y) => casesByYear.get(y));

  const jurPairs = mapToSortedPairs(casesByJur).slice(0, 10);
  const jurLabels = jurPairs.map((p) => p[0]);
  const jurValues = jurPairs.map((p) => p[1]);

  const catPairs = mapToSortedPairs(docsByCat);
  const catLabels = catPairs.map((p) => p[0]);
  const catValues = catPairs.map((p) => p[1]);

  const html = `
    <div class="grid cols-3">
      ${chartCard({ title: "重大案例（按年份）", desc: "按决定/立案日期年份统计（示例数据）", canvasId: "chartCasesYear", height: 240 })}
      ${chartCard({ title: "重大案例（按辖区）", desc: "按辖区统计 Top10（示例数据）", canvasId: "chartCasesJur", height: 240 })}
      ${chartCard({ title: "合作文件（按类别）", desc: "双边 / 自贸协定 / 多边（示例数据）", canvasId: "chartDocsCat", height: 240 })}
    </div>

    <div class="grid cols-2" style="margin-top: 14px">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">自定义报表（示例）</div>
            <div class="card-desc">选择数据集与分组维度，生成表格并导出（Excel/CSV）。</div>
          </div>
        </div>
        <div class="card-body">
          <form class="filters" id="reportForm">
            <div class="field">
              <label>数据集</label>
              <select name="dataset">
                <option value="cases">重大案例</option>
                <option value="docs">合作文件</option>
                <option value="updates">政策动态</option>
              </select>
            </div>
            <div class="field">
              <label>分组</label>
              <select name="groupBy">
                <option value="year">年份</option>
                <option value="jurisdiction">辖区</option>
                <option value="category">类别（仅合作文件）</option>
                <option value="type">类型</option>
              </select>
            </div>
            <div class="field" style="align-self:end">
              <button class="btn btn-primary" type="submit">生成报表</button>
            </div>
          </form>

          <div class="row-actions" style="margin-top: 10px">
            <button class="btn" id="exportReportCsv" disabled>导出 CSV</button>
            <button class="btn" id="exportReportXls" disabled>导出 Excel</button>
          </div>

          <div class="table-wrap" style="margin-top: 12px">
            <table class="table" id="reportTable">
              <thead><tr><th>维度</th><th style="width:120px">数量</th></tr></thead>
              <tbody><tr><td colspan="2"><div class="muted">请生成报表。</div></td></tr></tbody>
            </table>
          </div>

          <div class="muted" style="margin-top: 8px">说明：本页统计均由“示例数据集”计算得出，用于展示数据标准与分析工作台形态。</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">数据治理要点（落地建议）</div>
            <div class="card-desc">生产版可在本模块承载：统计口径、ETL 校验、版本化与审计追踪。</div>
          </div>
        </div>
        <div class="card-body">
          ${section(
            "建议的统计口径",
            `<ul class="ul">
              <li>案件：以“决定/立案日期”为主键；处罚金额标准化（币种、税费、口径）。</li>
              <li>法律法规：以“版本号/修订日期”区分；条款结构化（章/节/条）。</li>
              <li>动态：按“来源—类型—主题—重要性”统一分类；保留原文快照与引用。</li>
              <li>合作文件：统一“主体（国家/机构）—类别—生效信息—协作机制”元数据。</li>
            </ul>`
          )}
          ${section(
            "可扩展能力",
            `<ul class="ul">
              <li>接入全文索引（PDF/HTML）与批量翻译/术语库。</li>
              <li>报表：多维透视 + 订阅推送 + 导出模板（对接公文体系）。</li>
              <li>权限与水印：按角色/密级控制下载与外发。</li>
            </ul>`
          )}
        </div>
      </div>
    </div>
  `;

  return {
    key: "analytics",
    title: "数据统计与分析",
    crumbs: [{ label: "数据统计与分析" }],
    html,
    init: () => {
      drawBarChart(document.getElementById("chartCasesYear"), {
        labels: years,
        values: yearValues,
        title: "案例数 / 年",
        yLabel: "数量",
      });

      drawBarChart(document.getElementById("chartCasesJur"), {
        labels: jurLabels,
        values: jurValues,
        title: "案例数 / 辖区",
        yLabel: "数量",
      });

      drawBarChart(document.getElementById("chartDocsCat"), {
        labels: catLabels,
        values: catValues,
        title: "合作文件 / 类别",
        yLabel: "数量",
      });

      let reportRows = [];

      const form = document.getElementById("reportForm");
      const table = document.getElementById("reportTable");
      const btnCsv = document.getElementById("exportReportCsv");
      const btnXls = document.getElementById("exportReportXls");

      const renderTable = () => {
        const body = reportRows.length
          ? reportRows
              .map((r) => `<tr><td>${escapeHtml(r.dim)}</td><td>${escapeHtml(r.count)}</td></tr>`)
              .join("")
          : `<tr><td colspan="2"><div class="muted">请生成报表。</div></td></tr>`;
        table.querySelector("tbody").innerHTML = body;
        btnCsv.toggleAttribute("disabled", !reportRows.length);
        btnXls.toggleAttribute("disabled", !reportRows.length);
      };

      const buildReport = (dataset, groupBy) => {
        let arr = [];
        if (dataset === "cases") arr = data.cases;
        if (dataset === "docs") arr = data.documents;
        if (dataset === "updates") arr = data.updates;

        const map = new Map();
        for (const it of arr) {
          let dim = "";
          if (groupBy === "year") dim = yearOf(it.decisionDate || it.signedDate || it.date);
          if (groupBy === "jurisdiction") dim = it.jurisdiction || it.jurisdictionOrOrg || "";
          if (groupBy === "category") dim = it.category || "";
          if (groupBy === "type") dim = it.type || "";
          if (!dim) continue;
          map.set(dim, (map.get(dim) || 0) + 1);
        }

        const rows = Array.from(map.entries())
          .map(([dim, count]) => ({ dim, count }))
          .sort((a, b) => b.count - a.count || a.dim.localeCompare(b.dim));
        return rows;
      };

      form?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const dataset = String(fd.get("dataset") || "cases");
        const groupBy = String(fd.get("groupBy") || "year");
        reportRows = buildReport(dataset, groupBy);
        renderTable();
      });

      btnCsv?.addEventListener("click", () => {
        exportCsv("custom_report.csv", [{ key: "dim", header: "dimension" }, { key: "count", header: "count" }], reportRows);
      });

      btnXls?.addEventListener("click", () => {
        exportExcelHtml("custom_report.xls", [{ key: "dim", header: "dimension" }, { key: "count", header: "count" }], reportRows);
      });

      renderTable();
    },
  };
}
