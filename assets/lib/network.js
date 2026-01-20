import { resizeCanvasToDisplaySize } from "./charts.js";

/**
 * Very small force-directed graph renderer (Canvas).
 * No external deps; designed for demo datasets (< ~120 nodes).
 */

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function step(nodes, edges, w, h) {
  const repulsion = 2600;
  const spring = 0.014;
  const damping = 0.86;

  // repulsion
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist2 = dx * dx + dy * dy + 0.01;
      const f = repulsion / dist2;
      const fx = f * dx;
      const fy = f * dy;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  // springs
  for (const e of edges) {
    const a = nodes[e.sIdx];
    const b = nodes[e.tIdx];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const target = e.len;
    const diff = dist - target;
    const f = spring * diff;
    const fx = (f * dx) / dist;
    const fy = (f * dy) / dist;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // integrate
  for (const n of nodes) {
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;

    // bounds
    const pad = 26;
    n.x = Math.max(pad, Math.min(w - pad, n.x));
    n.y = Math.max(pad, Math.min(h - pad, n.y));
  }
}

function draw(ctx, nodes, edges, hoverId) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // edges
  ctx.lineWidth = 1;
  for (const e of edges) {
    const a = nodes[e.sIdx];
    const b = nodes[e.tIdx];
    ctx.strokeStyle = "rgba(15,23,42,0.18)";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // nodes
  for (const n of nodes) {
    const isHover = n.id === hoverId;
    const r = isHover ? n.r + 2 : n.r;
    ctx.fillStyle = n.color;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // label
    ctx.fillStyle = "rgba(15,23,42,0.78)";
    ctx.font = "12px system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, n.y + r + 13);
  }
}

function hitTest(nodes, mx, my) {
  for (const n of nodes) {
    const dx = mx - n.x;
    const dy = my - n.y;
    if (dx * dx + dy * dy <= (n.r + 3) * (n.r + 3)) return n;
  }
  return null;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{nodes:Array<{id:string,label:string,kind:string,url:string}>, edges:Array<{source:string,target:string,kind?:string}>}} graph
 */
export function renderNetwork(canvas, graph) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  resizeCanvasToDisplaySize(canvas);
  const w = canvas.width;
  const h = canvas.height;

  const palette = {
    agency: "rgba(11,74,162,0.78)",
    org: "rgba(15,118,110,0.76)",
    doc: "rgba(161,98,7,0.72)",
  };

  const idToIdx = new Map();
  const nodes = graph.nodes.map((n, i) => {
    idToIdx.set(n.id, i);
    const kind = n.kind;
    const color = palette[kind] || "rgba(11,74,162,0.78)";
    return {
      ...n,
      x: rand(60, w - 60),
      y: rand(40, h - 60),
      vx: 0,
      vy: 0,
      r: kind === "doc" ? 9 : kind === "org" ? 10 : 11,
      color,
    };
  });

  const edges = graph.edges
    .map((e) => {
      const sIdx = idToIdx.get(e.source);
      const tIdx = idToIdx.get(e.target);
      if (sIdx === undefined || tIdx === undefined) return null;
      return { ...e, sIdx, tIdx, len: 120 };
    })
    .filter(Boolean);

  // warm-up simulation
  for (let i = 0; i < 160; i++) step(nodes, edges, w, h);

  let hoverId = "";
  draw(ctx, nodes, edges, hoverId);

  function toLocal(ev) {
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    return { x: (ev.clientX - rect.left) * ratio, y: (ev.clientY - rect.top) * ratio };
  }

  const onMove = (ev) => {
    const { x, y } = toLocal(ev);
    const hit = hitTest(nodes, x, y);
    const next = hit?.id || "";
    if (next !== hoverId) {
      hoverId = next;
      canvas.style.cursor = hit ? "pointer" : "default";
      draw(ctx, nodes, edges, hoverId);
    }
  };

  const onClick = (ev) => {
    const { x, y } = toLocal(ev);
    const hit = hitTest(nodes, x, y);
    if (hit?.url) location.hash = hit.url;
  };

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("click", onClick);

  const onResize = () => {
    resizeCanvasToDisplaySize(canvas);
    draw(ctx, nodes, edges, hoverId);
  };

  window.addEventListener("resize", onResize);

  return () => {
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("click", onClick);
    window.removeEventListener("resize", onResize);
  };
}
