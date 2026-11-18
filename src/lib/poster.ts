// 「海报」：画在 2D canvas 上，再交给 glass.ts 当纹理，让液态玻璃去折射它。
//
// 纯构成主义：红、黑、纸色三种颜色；一条斜轴贯穿画面，
// 红色圆盘、黑色楔形、粗杠、同心弧、斜纹块、点阵，名字压在轴上，压到红盘的部分反白。

export interface Palette {
  paper: string;
  ink: string;
  red: string;
}

import { drawTree } from './freegroup';

type Ctx = CanvasRenderingContext2D;

const rad = (deg: number) => (deg * Math.PI) / 180;

export const DISPLAY = `'Anton', 'Noto Sans SC Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif`;

/** 进首页前要先加载好的字体 */
export const posterFonts = ['400 100px "Anton"', '900 100px "Noto Sans SC Variable"'];

const font = (px: number) => `900 ${px}px ${DISPLAY}`;

interface Fit {
  size: number;
  w: number;
  cap: number;
  left: number;
}

/** 让文字在不超过 maxW × maxCap 的前提下尽量大 */
function fit(ctx: Ctx, text: string, maxW: number, maxCap: number): Fit {
  const probe = 200;
  ctx.font = font(probe);
  const m = ctx.measureText(text);
  const pw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const pc = m.actualBoundingBoxAscent;
  const size = probe * Math.min(maxW / pw, maxCap / pc);
  ctx.font = font(size);
  const mm = ctx.measureText(text);
  return {
    size,
    w: mm.actualBoundingBoxLeft + mm.actualBoundingBoxRight,
    cap: mm.actualBoundingBoxAscent,
    left: mm.actualBoundingBoxLeft,
  };
}

function dot(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  if (r <= 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** 斜纹块：在 (x, y, w, h) 的矩形里填满向右上倾斜的条纹 */
function stripes(ctx: Ctx, x: number, y: number, w: number, h: number, pitch: number, color: string) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  const slant = h * 1.1;
  for (let sx = x - slant; sx < x + w + pitch; sx += pitch) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + pitch * 0.5, y + h);
    ctx.lineTo(sx + pitch * 0.5 + slant, y);
    ctx.lineTo(sx + slant, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** 点阵 */
function dots(ctx: Ctx, x: number, y: number, cols: number, rows: number, gap: number, r: number, color: string) {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) dot(ctx, x + i * gap, y + j * gap, r, color);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);

// ───────────────────────────── 首页 ─────────────────────────────

/**
 * @param progress 进场动画的进度 0→1：各个部件沿着轴线依次滑进画面。1 就是最终的静止构图。
 */
export function paintHome(ctx: Ctx, W: number, H: number, text: string, p: Palette, progress = 1) {
  // 第 i 组部件的进度（错开出场）
  const e = (i: number) => easeOut(progress * 2.1 - i * 0.16);
  const portrait = W / H < 0.8;
  const theta = portrait ? -62 : -13;

  ctx.save();
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, W, H);

  const f = portrait ? fit(ctx, text, H * 0.62, W * 0.41) : fit(ctx, text, Math.min(W * 0.74, H * 1.42), H * 0.41);
  const { w: tw, cap: c } = f;
  const far = (W + H) * 2;

  ctx.translate(W * (portrait ? 0.5 : 0.49), H * (portrait ? 0.48 : 0.5));
  ctx.rotate(rad(theta));

  // 以下坐标都在「沿主轴」的坐标系里：x 沿轴向右上，y 垂直于轴向下
  const x0 = -tw / 2;
  const x1 = tw / 2;
  const top = -c / 2;
  const base = c / 2;

  // 红色圆盘
  const R = c * 0.84;
  const disc = { x: tw * 0.2, y: -c * 0.14, r: R * (0.001 + 0.999 * e(0)) };
  dot(ctx, disc.x, disc.y, disc.r, p.red);

  // 圆盘外的同心弧
  ctx.strokeStyle = p.ink;
  ctx.lineCap = 'butt';
  (
    [
      [1.13, -78, 28, 0.021],
      [1.24, -60, 6, 0.008],
      [1.31, -60, -18, 0.008],
    ] as const
  ).forEach(([k, a0, a1, lw], i) => {
    ctx.lineWidth = c * lw;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, R * k, rad(a0), rad(a0 + (a1 - a0) * e(3 + i * 0.5)));
    ctx.stroke();
  });

  // 黑色楔形：从左上方刺入圆盘，上面压一道纸色的细缝
  const slide = (1 - e(1)) * far;
  const tip = { x: tw * 0.2 - R * 0.05 - slide, y: top - c * 0.22 };
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.moveTo(tip.x - c * 3.4, tip.y - c * 0.98);
  ctx.lineTo(tip.x - c * 3.4, tip.y + c * 0.15);
  ctx.lineTo(tip.x, tip.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = p.paper;
  ctx.fillRect(tip.x - c * 2.25, tip.y - c * 0.23, c * 0.62, c * 0.026);
  ctx.fillRect(tip.x - c * 2.25, tip.y - c * 0.15, c * 0.3, c * 0.026);

  // 名字下方：贯穿画面的粗杠、一段红杠、一根带刻度的细线
  ctx.fillStyle = p.ink;
  ctx.fillRect(-far + (1 - e(1)) * far * 1.2, base + c * 0.085, far * 2, c * 0.1);
  const lineX = x0 + tw * 0.36 + (1 - e(2)) * far;
  ctx.fillRect(lineX, base + c * 0.235, far, c * 0.013);
  for (let i = 0; i < 14; i++) {
    ctx.fillRect(lineX + tw * 0.34 + i * c * 0.05, base + c * 0.235 - c * (i % 5 === 0 ? 0.06 : 0.032), c * 0.008, c * (i % 5 === 0 ? 0.06 : 0.032));
  }
  ctx.fillStyle = p.red;
  ctx.fillRect(-far - (1 - e(2)) * far, base + c * 0.235, far + x0 + tw * 0.32, c * 0.04);

  // 右下的斜纹块
  const sw = tw * 0.34 * e(4);
  stripes(ctx, x1 - tw * 0.04 - sw, base + c * 0.315, sw, c * 0.17, c * 0.05, p.ink);

  // 点阵
  dots(ctx, x0 + tw * 0.22, base + c * 0.345, 7, 3, c * 0.062, c * 0.013 * e(4.6), p.ink);

  // 点缀：小黑圆、小红方块、圆环
  dot(ctx, x0 - c * 0.03, base + c * 0.56, c * 0.075 * e(5), p.ink);
  const sq = c * 0.13 * e(5.4);
  ctx.fillStyle = p.red;
  ctx.fillRect(disc.x + R * 1.5 - sq / 2, disc.y - R * 0.56 - sq / 2, sq, sq);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = c * 0.02;
  const ring = c * 0.07 * e(5.8);
  if (ring > 0.5) {
    ctx.beginPath();
    ctx.arc(disc.x + R * 1.56, disc.y + R * 0.22, ring, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 名字：纸面上是黑字，压到红盘上的部分反白
  const tx = x0 + f.left - (1 - e(1.6)) * far * 0.5;
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(f.size);
  ctx.fillStyle = p.ink;
  ctx.fillText(text, tx, base);
  ctx.save();
  ctx.beginPath();
  ctx.arc(disc.x, disc.y, disc.r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = p.paper;
  ctx.fillText(text, tx, base);
  ctx.restore();

  ctx.restore();
}

// ───────────────────────────── 群论系列页 ─────────────────────────────
// 同样的斜轴、楔形和粗杠，但红色圆盘变成了双曲平面：
// 里面是自由群 F₂ 的 Cayley 树，沿着斜轴不停地流过去（见 freegroup.ts）。

/** 树沿 a 走一步要花的秒数 */
export const STEP_SECONDS = 3.4;

export function paintSeries(ctx: Ctx, W: number, H: number, text: string, p: Palette, seconds: number) {
  const portrait = W / H < 0.8;
  const theta = portrait ? -62 : -13;

  ctx.save();
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, W, H);

  const R = portrait ? Math.min(W * 0.43, H * 0.25) : Math.min(H * 0.385, W * 0.25);
  const far = (W + H) * 2;
  ctx.translate(W * 0.5, H * (portrait ? 0.43 : 0.57));
  ctx.rotate(rad(theta));

  // 沿主轴的坐标系：x 沿轴向右上，y 垂直于轴向下
  const disc = { x: portrait ? R * 0.5 : R * 0.86, y: -R * 0.06 };
  const barY = disc.y + R * 0.74;

  // 黑色楔形，尖端刺进圆盘
  const tip = { x: disc.x - R * 0.5, y: disc.y - R * 0.3 };
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.moveTo(tip.x - R * 4.6, tip.y - R * 1.3);
  ctx.lineTo(tip.x - R * 4.6, tip.y + R * 0.2);
  ctx.lineTo(tip.x, tip.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = p.paper;
  ctx.fillRect(tip.x - R * 2.7, tip.y - R * 0.3, R * 0.7, R * 0.03);
  ctx.fillRect(tip.x - R * 2.7, tip.y - R * 0.2, R * 0.34, R * 0.03);

  // 红色圆盘 = 双曲平面
  dot(ctx, disc.x, disc.y, R, p.red);
  ctx.save();
  ctx.beginPath();
  ctx.arc(disc.x, disc.y, R, 0, Math.PI * 2);
  ctx.clip();
  drawTree(ctx, disc.x, disc.y, R, seconds / STEP_SECONDS, { a: p.ink, b: p.ink, node: p.ink, tile: p.paper }, {
    minLen: Math.max(2, R / 150),
    weight: Math.max(1, R / 300),
  });
  ctx.restore();

  // 圆盘外的弧
  ctx.strokeStyle = p.ink;
  ctx.lineCap = 'butt';
  (
    [
      [1.1, -80, 30, 0.024],
      [1.2, -62, 8, 0.009],
      [1.27, -62, -16, 0.009],
    ] as const
  ).forEach(([k, a0, a1, lw]) => {
    ctx.lineWidth = R * lw;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, R * k, rad(a0), rad(a1));
    ctx.stroke();
  });

  // 粗杠、红杠、带刻度的细线
  ctx.fillStyle = p.ink;
  ctx.fillRect(-far, barY, far * 2, R * 0.12);
  const lineX = disc.x - R * 0.7;
  ctx.fillRect(lineX, barY + R * 0.19, far, R * 0.015);
  for (let i = 0; i < 14; i++) {
    const h = R * (i % 5 === 0 ? 0.07 : 0.038);
    ctx.fillRect(lineX + R * 1.15 + i * R * 0.06, barY + R * 0.19 - h, R * 0.01, h);
  }
  ctx.fillStyle = p.red;
  ctx.fillRect(-far, barY + R * 0.19, far + lineX - R * 0.08, R * 0.048);

  // 斜纹块、点阵、小件
  stripes(ctx, disc.x + R * 0.1, barY + R * 0.29, R * 0.95, R * 0.2, R * 0.06, p.ink);
  ctx.fillStyle = p.red;
  ctx.fillRect(disc.x + R * 1.42, disc.y - R * 0.5, R * 0.16, R * 0.16);

  // 标题：压在粗杠上方的纸面上，右端贴着圆盘；多个单词就一词一行叠起来。左边跟一块点阵
  const lines = text.split(/\s+/).filter(Boolean);
  const gap = 0.16; // 行距（以大写字母高度为单位）
  const maxW = portrait ? R * 1.15 : R * 2.3;
  const maxH = portrait ? R * 0.56 : R * 0.8;
  const capMax = maxH / (lines.length + (lines.length - 1) * gap);
  const size = Math.min(...lines.map((line) => fit(ctx, line, maxW, capMax).size));
  ctx.font = font(size);
  ctx.fillStyle = p.ink;
  ctx.textBaseline = 'alphabetic';
  const right = disc.x - R * 1.16;
  let left = right;
  let y = barY - R * 0.1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = ctx.measureText(lines[i]);
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    ctx.fillText(lines[i], right - w + m.actualBoundingBoxLeft, y);
    left = Math.min(left, right - w);
    y -= m.actualBoundingBoxAscent * (1 + gap);
  }
  dots(ctx, left - R * 0.72, barY - R * 0.3, 7, 3, R * 0.075, R * 0.016, p.ink);

  ctx.restore();
}
