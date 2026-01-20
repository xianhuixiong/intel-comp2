export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Event delegation helper.
 * @param {Element|Document} root
 * @param {string} event
 * @param {string} selector
 * @param {(ev:Event, target:Element)=>void} handler
 */
export function delegate(root, event, selector, handler) {
  root.addEventListener(event, (ev) => {
    const t = /** @type {Element|null} */ (ev.target instanceof Element ? ev.target : null);
    if (!t) return;
    const hit = t.closest(selector);
    if (!hit) return;
    handler(ev, hit);
  });
}

export function setAttr(el, attrs = {}) {
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    el.setAttribute(k, String(v));
  });
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  setAttr(el, attrs);
  for (const ch of children) {
    if (typeof ch === "string") el.appendChild(document.createTextNode(ch));
    else if (ch) el.appendChild(ch);
  }
  return el;
}
