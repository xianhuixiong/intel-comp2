import { escapeHtml } from "./strings.js";

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportCsv(filename, columns, rows) {
  const header = columns.map((c) => String(c.header || c.key)).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const raw = r[c.key] ?? "";
          const s = String(raw);
          const needsQuote = /[\",\n\r]/.test(s);
          const escaped = s.replaceAll('"', '""');
          return needsQuote ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}\n`;
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

/**
 * Excel-compatible export (HTML table packaged as .xls).
 * This is a pragmatic choice for a no-build, no-dependency prototype.
 */
export function exportExcelHtml(filename, columns, rows, sheetName = "Sheet1") {
  const thead = `<tr>${columns
    .map((c) => `<th>${escapeHtml(c.header || c.key)}</th>`)
    .join("")}</tr>`;

  const tbody = rows
    .map((r) => {
      const tds = columns
        .map((c) => `<td>${escapeHtml(r[c.key] ?? "")}</td>`)
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
<table border="1">
<thead>${thead}</thead>
<tbody>${tbody}</tbody>
</table>
</body>
</html>`;

  // Excel will open this. Users may see a safety warning.
  downloadBlob(filename, new Blob([html], { type: "application/vnd.ms-excel" }));
}
