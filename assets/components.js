import { escapeHtml, formatDate, fmtImportance } from "./lib/strings.js";

export function badge(kind, text, cls = "") {
  const map = {
    Bilateral: "primary",
    Multilateral: "success",
    FTA: "warning",
  };
  const k = map[kind] || cls || "";
  return `<span class="badge ${k}">${escapeHtml(text)}</span>`;
}

export function importanceBadge(level) {
  const imp = fmtImportance(level);
  return `<span class="badge ${imp.cls}">${escapeHtml(imp.label)}</span>`;
}

export function favButton(id, isActive) {
  const cls = isActive ? "fav active" : "fav";
  const title = isActive ? "取消收藏" : "加入收藏";
  return `<button class="icon-btn ${cls}" data-action="fav" data-id="${escapeHtml(id)}" aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}">★</button>`;
}

export function externalLink(url, label = "原文") {
  return `<a class="link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)} ↗</a>`;
}

export function formatKv(obj) {
  return `<div class="kv">${Object.entries(obj)
    .map(([k, v]) => `<div class="k">${escapeHtml(k)}</div><div class="v">${v}</div>`)
    .join("")}</div>`;
}

export function section(title, bodyHtml) {
  return `<div class="section"><h3>${escapeHtml(title)}</h3>${bodyHtml}</div>`;
}

export function pills(items) {
  if (!items?.length) return "<span class=\"muted\">—</span>";
  return `<div class="pill-links">${items.join("")}</div>`;
}

export function pillLink(href, label) {
  return `<a class="pill" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

export function emptyState(title, desc = "") {
  return `
    <div class="empty">
      <div class="empty-title">${escapeHtml(title)}</div>
      ${desc ? `<div class="empty-desc">${escapeHtml(desc)}</div>` : ""}
    </div>
  `;
}

export function datePill(dateIso) {
  return `<span class="pill pill-date">${escapeHtml(formatDate(dateIso))}</span>`;
}
