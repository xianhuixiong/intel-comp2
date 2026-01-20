import { normalize } from "./strings.js";

/**
 * @typedef {Object} SearchEntry
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} subtitle
 * @property {string} url
 * @property {string} haystack
 * @property {string[]} tags
 */

/**
 * Build a lightweight full-text index.
 */
export function buildSearchIndex(data) {
  /** @type {SearchEntry[]} */
  const out = [];

  const push = (e) => {
    out.push({ ...e, haystack: normalize(e.haystack), title: e.title || "", subtitle: e.subtitle || "", tags: e.tags || [] });
  };

  for (const d of data.documents || []) {
    push({
      id: d.id,
      type: "合作文件",
      title: d.titleCn || d.title,
      subtitle: `${d.category} · ${d.type} · ${d.parties.join(" / ")}`,
      url: `#/cooperation/${encodeURIComponent(d.id)}`,
      haystack: [d.id, d.title, d.titleCn, d.summaryCn, d.parties.join(" "), (d.tags || []).join(" ")].join(" "),
      tags: d.tags || [],
    });
  }

  for (const l of data.laws || []) {
    push({
      id: l.id,
      type: "法律法规",
      title: l.nameCn || l.nameEn,
      subtitle: `${l.jurisdiction} · ${l.type} · ${l.level}`,
      url: `#/laws/${encodeURIComponent(l.id)}`,
      haystack: [l.id, l.nameCn, l.nameEn, l.summaryCn, l.issuingBody, (l.keyTopics || []).join(" ")].join(" "),
      tags: l.keyTopics || [],
    });
  }

  for (const a of data.agencies || []) {
    push({
      id: a.id,
      type: "执法机构",
      title: a.nameCn || a.nameEn,
      subtitle: `${a.jurisdiction} · ${a.abbrev} · ${a.type}`,
      url: `#/agencies/${encodeURIComponent(a.id)}`,
      haystack: [a.id, a.nameCn, a.nameEn, a.abbrev, a.mandateCn, (a.cooperation?.focusCn || []).join(" ")].join(" "),
      tags: a.cooperation?.focusCn || [],
    });
  }

  for (const o of data.organizations || []) {
    push({
      id: o.id,
      type: "国际组织",
      title: o.nameCn || o.nameEn,
      subtitle: `${o.abbrev} · ${o.type}`,
      url: `#/agencies/org/${encodeURIComponent(o.id)}`,
      haystack: [o.id, o.nameCn, o.nameEn, o.overviewCn, (o.keyMechanismsCn || []).join(" ")].join(" "),
      tags: o.keyMechanismsCn || [],
    });
  }

  for (const u of data.updates || []) {
    push({
      id: u.id,
      type: "政策动态",
      title: u.titleCn || u.title,
      subtitle: `${u.date} · ${u.jurisdictionOrOrg} · ${u.type}`,
      url: `#/updates/${encodeURIComponent(u.id)}`,
      haystack: [u.id, u.title, u.titleCn, u.summaryCn, u.jurisdictionOrOrg, (u.tags || []).join(" ")].join(" "),
      tags: u.tags || [],
    });
  }

  for (const c of data.cases || []) {
    push({
      id: c.id,
      type: "重大案件",
      title: c.titleCn || c.title,
      subtitle: `${c.jurisdiction} · ${c.authority} · ${c.decisionDate}`,
      url: `#/cases/${encodeURIComponent(c.id)}`,
      haystack: [c.id, c.title, c.titleCn, c.caseNo, c.conductCn, c.outcomeCn, c.analysisCn, c.sector, (c.tags || []).join(" ")].join(" "),
      tags: c.tags || [],
    });
  }

  for (const r of data.research || []) {
    push({
      id: r.id,
      type: "专题研究",
      title: r.titleCn || r.title,
      subtitle: `${r.publisher} · ${r.publishDate} · ${r.type}`,
      url: `#/research/${encodeURIComponent(r.id)}`,
      haystack: [r.id, r.title, r.titleCn, r.publisher, r.summaryCn, (r.tags || []).join(" ")].join(" "),
      tags: r.tags || [],
    });
  }

  for (const g of data.glossary || []) {
    push({
      id: `GLOSSARY:${g.term}`,
      type: "术语",
      title: g.term,
      subtitle: g.termEn || "",
      url: `#/research/glossary?term=${encodeURIComponent(g.term)}`,
      haystack: [g.term, g.termEn, g.definitionCn, (g.tags || []).join(" ")].join(" "),
      tags: g.tags || [],
    });
  }

  return out;
}

function scoreEntry(entry, tokens) {
  let score = 0;
  const hay = entry.haystack;
  const title = normalize(entry.title);
  const subtitle = normalize(entry.subtitle);

  for (const t of tokens) {
    if (!t) continue;
    if (title.includes(t)) score += 12;
    if (subtitle.includes(t)) score += 4;
    // count occurrences in haystack (capped)
    let idx = hay.indexOf(t);
    let c = 0;
    while (idx !== -1 && c < 6) {
      score += 1;
      c += 1;
      idx = hay.indexOf(t, idx + t.length);
    }
  }

  // slight preference for shorter title
  score += Math.max(0, 3 - Math.floor(entry.title.length / 25));
  return score;
}

export function search(index, query, limit = 40) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean).slice(0, 6);

  const scored = index
    .map((e) => ({ e, s: scoreEntry(e, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.e);

  return scored;
}

export function suggest(index, query, limit = 6) {
  return search(index, query, limit);
}
