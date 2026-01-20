import { escapeHtml } from "./strings.js";

export function resizeCanvasToDisplaySize(canvas, ratio = window.devicePixelRatio || 1) {
  const { width, height } = canvas.getBoundingClientRect();
  const w = Math.max(10, Math.floor(width * ratio));
  const h = Math.max(10, Math.floor(height * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    return true;
  }
  return false;
}

export function drawBarChart(canvas, { labels, values, title = "", yLabel = "" }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  resizeCanvasToDisplaySize(canvas);
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const padding = 42;
  const top = 20;
  const bottom = 34;
  const left = 42;
  const right = 12;

  const maxVal = Math.max(1, ...values);
  const plotW = w - left - right;
  const plotH = h - top - bottom;

  // title
  if (title) {
    ctx.fillStyle = "#0c1726";
    ctx.font = "600 13px system-ui, -apple-system";
    ctx.fillText(title, left, 16);
  }

  // axes
  ctx.strokeStyle = "rgba(15,23,42,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + plotH);
  ctx.lineTo(left + plotW, top + plotH);
  ctx.stroke();

  // y ticks
  ctx.fillStyle = "rgba(15,23,42,0.60)";
  ctx.font = "12px system-ui, -apple-system";
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = (maxVal * (ticks - i)) / ticks;
    const y = top + (plotH * i) / ticks;
    ctx.strokeStyle = "rgba(15,23,42,0.08)";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + plotW, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(v)), 6, y + 4);
  }

  // bars
  const n = labels.length;
  const gap = Math.max(6, Math.floor(plotW / (n * 12)));
  const barW = Math.max(10, Math.floor((plotW - gap * (n - 1)) / n));

  for (let i = 0; i < n; i++) {
    const x = left + i * (barW + gap);
    const v = values[i] || 0;
    const bh = Math.round((v / maxVal) * (plotH - 4));
    const y = top + plotH - bh;

    ctx.fillStyle = "rgba(11,74,162,0.78)";
    ctx.fillRect(x, y, barW, bh);

    // label
    const lab = labels[i];
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,0.70)";
    ctx.font = "11px system-ui, -apple-system";
    ctx.translate(x + barW / 2, top + plotH + 14);
    ctx.rotate(-0.38);
    ctx.textAlign = "right";
    ctx.fillText(lab, 0, 0);
    ctx.restore();
  }

  if (yLabel) {
    // y axis label
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,0.65)";
    ctx.font = "11px system-ui, -apple-system";
    ctx.translate(14, top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

export function chartCard({ title, desc, canvasId, height = 220 }) {
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escapeHtml(title)}</div>
          ${desc ? `<div class="card-desc">${escapeHtml(desc)}</div>` : ""}
        </div>
      </div>
      <div class="card-body">
        <canvas id="${escapeHtml(canvasId)}" class="chart" style="height:${height}px"></canvas>
      </div>
    </div>
  `;
}
