export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDate(iso) {
  if (!iso || iso === "—") return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y) return String(iso);
  return `${y}-${m ?? "??"}-${d ?? "??"}`;
}

export function yearOf(iso) {
  if (!iso || iso === "—") return "";
  return String(iso).slice(0, 4);
}

export function truncate(s, n = 120) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

export function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function fmtImportance(n) {
  const v = Number(n) || 1;
  if (v >= 3) return { label: "特别重要", cls: "danger" };
  if (v === 2) return { label: "重要", cls: "warning" };
  return { label: "一般", cls: "" };
}

export function joinTags(tags) {
  return (tags || []).filter(Boolean).join(", ");
}

export function safeUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  // allow http(s) only
  if (/^https?:\/\//i.test(u)) return u;
  return "";
}
