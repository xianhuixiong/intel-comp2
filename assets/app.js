import {
  DATA_VERSION,
  jurisdictions,
  organizations,
  documents,
  laws,
  agencies,
  updates,
  cases,
  research,
  glossary,
} from "./data/data.js";

import { $, $$, delegate, setText, setHtml, scrollTop } from "./lib/dom.js";
import { escapeHtml } from "./lib/strings.js";
import { loadFavorites, saveFavorites, loadPrefs, savePrefs, loadCompare, saveCompare } from "./lib/storage.js";
import { exportCsv, exportExcelHtml } from "./lib/exporter.js";
import { buildSearchIndex, searchIndex } from "./lib/search.js";

import { renderOverview } from "./pages/overview.js";
import { renderCooperationList, renderCooperationDetail } from "./pages/cooperation.js";
import { renderLawsList, renderLawDetail } from "./pages/laws.js";
import { renderAgenciesList, renderAgencyDetail, renderOrgDetail, renderAgenciesNetwork } from "./pages/agencies.js";
import { renderUpdatesList, renderUpdateDetail } from "./pages/updates.js";
import { renderCasesList, renderCaseDetail, renderCasesCompare } from "./pages/cases.js";
import { renderAnalytics } from "./pages/analytics.js";
import { renderResearchList, renderResearchDetail, renderGlossary } from "./pages/research.js";
import { renderFavorites } from "./pages/favorites.js";
import { renderAbout } from "./pages/about.js";
import { renderSearchPage } from "./pages/search.js";

const APP_TITLE = "Antitrust International Cooperation Database";

const DATA = { jurisdictions, organizations, documents, laws, agencies, updates, cases, research, glossary };

const NAV = [
  { key: "overview", label: "总览", href: "#/overview" },
  { key: "cooperation", label: "国际合作法律文件库", href: "#/cooperation" },
  { key: "laws", label: "域外法律法规库", href: "#/laws" },
  { key: "agencies", label: "执法机构信息库", href: "#/agencies" },
  { key: "updates", label: "政策动态监测", href: "#/updates" },
  { key: "cases", label: "重大案例库", href: "#/cases" },
  { key: "analytics", label: "数据统计与分析", href: "#/analytics" },
  { key: "research", label: "专题研究与参考", href: "#/research" },
  { key: "favorites", label: "我的收藏", href: "#/favorites" },
  { key: "about", label: "关于与标准", href: "#/about" },
];

function icon(name) {
  const map = {
    overview: "📊",
    cooperation: "🤝",
    laws: "📚",
    agencies: "🏛️",
    updates: "🛰️",
    cases: "⚖️",
    analytics: "📈",
    research: "🧩",
    favorites: "⭐",
    about: "ℹ️",
    search: "🔎",
  };
  return map[name] || "•";
}

const APP = {
  version: DATA_VERSION,
  favorites: loadFavorites(),
  prefs: loadPrefs(),
  compareSet: loadCompare(),
  persistFavorites() {
    saveFavorites(this.favorites);
    updateFavCount();
  },
  persistPrefs() {
    savePrefs(this.prefs);
  },
  persistCompare() {
    saveCompare(this.compareSet);
  },
  pageCleanup: null,
  currentExport: null,
};

// Search index
const SEARCH_ENTRIES = buildSearchIndex(DATA);
const doSearch = (q, limit = 50) => searchIndex(SEARCH_ENTRIES, q, limit);

function parseRoute() {
  const raw = (location.hash || "#/overview").slice(1);
  const [pathPart, queryPart] = raw.split("?");
  const parts = (pathPart || "/overview").split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryPart || ""));
  return { raw, parts, query };
}

function setActiveNav(key) {
  $$(".nav a").forEach((a) => a.classList.remove("active"));
  const el = $(`.nav a[data-key="${key}"]`);
  if (el) el.classList.add("active");
}

function renderNav() {
  const navEl = $("#nav");
  if (!navEl) return;
  navEl.innerHTML = NAV
    .map(
      (n) => {
        const extra =
          n.key === "favorites" ? `<span class="nav-count" id="favCount"></span>` : "";
        return `<a class="nav-item" href="${escapeHtml(n.href)}" data-key="${escapeHtml(n.key)}"><span class="nav-icon" aria-hidden="true">${icon(n.key)}</span><span>${escapeHtml(n.label)}</span>${extra}</a>`;
      }
    )
    .join("");
}

function updateFavCount() {
  const el = $("#favCount");
  if (!el) return;
  el.textContent = String(APP.favorites.size);
}

function setTitle(subtitle) {
  document.title = subtitle ? `${subtitle} · ${APP_TITLE}` : APP_TITLE;
}

function setBreadcrumbs(crumbs) {
  const el = $("#breadcrumb");
  if (!el) return;
  if (!crumbs?.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = crumbs
    .map((c, idx) => {
      const last = idx === crumbs.length - 1;
      const label = escapeHtml(c.label);
      if (c.href && !last) return `<a class="crumb" href="${escapeHtml(c.href)}">${label}</a><span class="crumb-sep">/</span>`;
      return `<span class="crumb">${label}</span>${last ? "" : `<span class="crumb-sep">/</span>`}`;
    })
    .join("");
}

function setPage(html) {
  const el = $("#page");
  if (!el) return;
  el.innerHTML = html;
}

function renderNotFound(route) {
  return {
    key: "not-found",
    title: "未找到",
    crumbs: [{ label: "未找到" }],
    html: `<div class="card pad"><div class="card-title">页面不存在</div><div class="card-desc">路由：${escapeHtml(route.raw)}</div><div style="margin-top:12px"><a class="btn" href="#/overview">返回总览</a></div></div>`,
  };
}

function routeToPage(route) {
  const [root] = route.parts;

  if (!root || root === "overview") return renderOverview({ data: DATA, route, app: APP });

  if (root === "cooperation") {
    if (route.parts[1]) return renderCooperationDetail({ data: DATA, route, app: APP });
    return renderCooperationList({ data: DATA, route, app: APP });
  }

  if (root === "laws") {
    if (route.parts[1]) return renderLawDetail({ data: DATA, route, app: APP });
    return renderLawsList({ data: DATA, route, app: APP });
  }

  if (root === "agencies") {
    if (route.parts[1] === "network") return renderAgenciesNetwork({ data: DATA, route, app: APP });
    if (route.parts[1] === "org") return renderOrgDetail({ data: DATA, route, app: APP });
    if (route.parts[1]) return renderAgencyDetail({ data: DATA, route, app: APP });
    return renderAgenciesList({ data: DATA, route, app: APP });
  }

  if (root === "updates") {
    if (route.parts[1]) return renderUpdateDetail({ data: DATA, route, app: APP });
    return renderUpdatesList({ data: DATA, route, app: APP });
  }

  if (root === "cases") {
    if (route.parts[1] === "compare") return renderCasesCompare({ data: DATA, route, app: APP });
    if (route.parts[1]) return renderCaseDetail({ data: DATA, route, app: APP });
    return renderCasesList({ data: DATA, route, app: APP });
  }

  if (root === "analytics") return renderAnalytics({ data: DATA, route, app: APP });

  if (root === "research") {
    if (route.parts[1] === "glossary") return renderGlossary({ data: DATA, route, app: APP });
    if (route.parts[1]) return renderResearchDetail({ data: DATA, route, app: APP });
    return renderResearchList({ data: DATA, route, app: APP });
  }

  if (root === "favorites") return renderFavorites({ data: DATA, route, app: APP });

  if (root === "about") return renderAbout({ data: DATA, route, app: APP });

  if (root === "search") return renderSearchPage({ data: DATA, route, app: APP, search: doSearch });

  return renderNotFound(route);
}

function render() {
  const route = parseRoute();

  // cleanup previous page resources (charts listeners via window, network anim loops etc)
  if (typeof APP.pageCleanup === "function") {
    try {
      APP.pageCleanup();
    } catch {
      // ignore
    }
  }
  APP.pageCleanup = null;
  APP.currentExport = null;

  const page = routeToPage(route) || renderNotFound(route);

  setTitle(page.title);
  setBreadcrumbs(page.crumbs || []);
  setPage(page.html || "");
  scrollTop();

  // active nav mapping for detail routes
  const root = route.parts[0] || "overview";
  const navKey =
    root === "cooperation" ? "cooperation" :
    root === "laws" ? "laws" :
    root === "agencies" ? "agencies" :
    root === "updates" ? "updates" :
    root === "cases" ? "cases" :
    root === "analytics" ? "analytics" :
    root === "research" ? "research" :
    root === "favorites" ? "favorites" :
    root === "about" ? "about" :
    root === "search" ? "search" : "overview";
  setActiveNav(navKey);

  // export config if provided
  if (page.export) APP.currentExport = page.export;

  // init
  if (typeof page.init === "function") {
    const maybeCleanup = page.init();
    if (typeof maybeCleanup === "function") APP.pageCleanup = maybeCleanup;
  }
}

function initHeaderSearch() {
  const input = $("#q");
  const box = $("#suggest");
  const btn = $("#searchBtn");
  if (!input || !box) return;

  let lastQ = "";

  const close = () => {
    box.innerHTML = "";
    box.style.display = "none";
  };

  const open = (html) => {
    box.innerHTML = html;
    box.style.display = "block";
  };

  const renderSuggest = () => {
    const q = String(input.value || "").trim();
    lastQ = q;
    if (!q) {
      close();
      return;
    }
    const results = doSearch(q, 8);
    if (!results.length) {
      open(`<div class="suggest-empty">无匹配结果</div>`);
      return;
    }
    open(
      `<div class="suggest-list">${results
        .map(
          (r) => `<a class="suggest-item" href="${escapeHtml(r.url)}">
            <div class="suggest-left">
              <div class="suggest-title">${escapeHtml(r.title)}</div>
              <div class="suggest-sub">${escapeHtml(r.subtitle)}</div>
            </div>
            <div class="suggest-badge">${escapeHtml(r.type)}</div>
          </a>`
        )
        .join("")}
        <a class="suggest-more" href="#/search?q=${encodeURIComponent(q)}">查看全部结果 →</a>
      </div>`
    );
  };

  input.addEventListener("input", () => {
    renderSuggest();
  });

  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    const q = String(input.value || "").trim();
    if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
    close();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = String(input.value || "").trim();
      if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
      close();
    }
    if (e.key === "Escape") {
      close();
      input.blur();
    }
  });

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t === input || box.contains(t)) return;
    close();
  });

  // Ctrl/Cmd+K to focus search
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
      renderSuggest();
    }
  });

  // "/" to focus search (when not typing in an input)
  document.addEventListener("keydown", (e) => {
    if (e.key === "/") {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target?.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
      renderSuggest();
    }
  });
}

function initGlobalActions() {
  // favorites toggle
  delegate(document, "click", "[data-action='fav']", (ev, el) => {
    ev.preventDefault();
    const id = el.getAttribute("data-id");
    if (!id) return;

    if (APP.favorites.has(id)) APP.favorites.delete(id);
    else APP.favorites.add(id);

    APP.persistFavorites();

    // update UI state (toggle class)
    el.classList.toggle("active", APP.favorites.has(id));

    // also update any other fav buttons with same id
    document.querySelectorAll(`[data-action='fav'][data-id='${CSS.escape(id)}']`).forEach((btn) => {
      btn.classList.toggle("active", APP.favorites.has(id));
    });
  });

  // export buttons
  delegate(document, "click", "[data-action='export-csv']", (ev, el) => {
    ev.preventDefault();
    const scope = el.getAttribute("data-scope");
    const cfg = APP.currentExport;
    if (!cfg || (scope && cfg.scope !== scope)) return;
    exportCsv(`${scope || "export"}.csv`, cfg.columns, cfg.rows);
  });

  delegate(document, "click", "[data-action='export-xls']", (ev, el) => {
    ev.preventDefault();
    const scope = el.getAttribute("data-scope");
    const cfg = APP.currentExport;
    if (!cfg || (scope && cfg.scope !== scope)) return;
    exportExcelHtml(`${scope || "export"}.xls`, cfg.columns, cfg.rows);
  });
}

function initShellControls() {
  // Mobile sidebar
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("sidebarToggle");
  toggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  // Close sidebar after navigation on small screens
  const nav = document.getElementById("nav");
  nav?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    sidebar?.classList.remove("open");
  });

  // Help modal
  const modal = document.getElementById("modal");
  const helpBtn = document.getElementById("helpBtn");
  const openModal = () => {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };
  helpBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
  modal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.getAttribute?.("data-close") === "1" || t?.closest?.("[data-close='1']")) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      sidebar?.classList.remove("open");
    }
  });
}

function init() {
  renderNav();
  updateFavCount();

  // header
  const versionEl = $("#version");
  if (versionEl) versionEl.textContent = DATA_VERSION;

  initHeaderSearch();
  initGlobalActions();
  initShellControls();

  window.addEventListener("hashchange", render);
  render();
}

init();
