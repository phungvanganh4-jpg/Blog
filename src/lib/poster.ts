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

// ───────────────────────────── 封面横幅 ─────────────────────────────
// 每个页面顶部一条：同一套语汇，由 seed（文章 id）决定具体怎么摆，
// 所以每篇都不一样、但都是一家人。

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paintCover(ctx: Ctx, W: number, H: number, seed: string, p: Palette) {
  const rnd = mulberry32(hash(seed));
  const between = (a: number, b: number) => a + (b - a) * rnd();
  const u = H; // 一切尺寸以横幅高度为单位
  const theta = -13;
  const kind = Math.floor(rnd() * 3);
  const flip = rnd() < 0.5;
  /** 横向位置（0–1）；flip 时左右对调，但所有斜线的方向不变 */
  const X = (t: number) => W * (flip ? 1 - t : t);
  const sgn = flip ? -1 : 1;

  ctx.save();
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, W, H);

  /** 沿主轴摆的一组细节：斜纹块、点阵、几根长短不一的线 */
  const details = (cx: number, cy: number, color: string, accent: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad(theta));
    stripes(ctx, -u * 0.55, -u * 0.3, u * between(0.75, 1.05), u * 0.16, u * 0.05, color);
    ctx.fillStyle = color;
    ctx.fillRect(-u * 0.55, -u * 0.06, u * between(1.1, 1.5), u * 0.045);
    ctx.fillRect(-u * 0.55, u * 0.05, u * between(0.5, 0.8), u * 0.014);
    ctx.fillStyle = accent;
    ctx.fillRect(u * between(0.1, 0.3), u * 0.05, u * between(0.35, 0.6), u * 0.036);
    dots(ctx, -u * 0.52, u * 0.17, 8, 3, u * 0.062, u * 0.013, color);
    ctx.restore();
  };
  const ring = (cx: number, cy: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = u * 0.022;
    ctx.beginPath();
    ctx.arc(cx, cy, u * 0.07, 0, Math.PI * 2);
    ctx.stroke();
  };
  const square = (cx: number, cy: number, s: number, color: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad(theta));
    ctx.fillStyle = color;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  };

  if (kind === 0) {
    // ── 圆盘 + 楔形 ──
    const dx = X(between(0.2, 0.33));
    const dy = H * between(0.42, 0.6);
    const dr = u * between(0.46, 0.62);
    const discColor = rnd() < 0.75 ? p.red : p.ink;
    const wedgeColor = discColor === p.red ? p.ink : p.red;
    dot(ctx, dx, dy, dr, discColor);
    ctx.strokeStyle = p.ink;
    const a0 = flip ? between(-70, -40) : between(120, 150);
    const sweep = between(70, 110);
    ctx.lineWidth = u * 0.022;
    ctx.beginPath();
    ctx.arc(dx, dy, dr * 1.15, rad(a0), rad(a0 + sweep));
    ctx.stroke();
    ctx.lineWidth = u * 0.009;
    ctx.beginPath();
    ctx.arc(dx, dy, dr * 1.27, rad(a0 + 12), rad(a0 + sweep * 0.7));
    ctx.stroke();

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rad(theta));
    const off = dr * between(0.3, 0.55);
    ctx.fillStyle = wedgeColor;
    ctx.beginPath();
    ctx.moveTo(sgn * W * 1.1, -dr * between(1.0, 1.25));
    ctx.lineTo(sgn * W * 1.1, -dr * 0.02);
    ctx.lineTo(-sgn * dr * 0.2, -dr * between(0.36, 0.5));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.ink;
    ctx.fillRect(-W * 2, off, W * 4, u * 0.085);
    ctx.fillStyle = p.red;
    const from = sgn * dr * 0.3;
    ctx.fillRect(Math.min(from, sgn * W * 2), off + u * 0.15, Math.abs(sgn * W * 2 - from), u * 0.032);
    ctx.restore();

    // 细节压在楔形上，用纸色
    details(X(between(0.66, 0.78)), H * between(0.3, 0.4), p.paper, wedgeColor === p.ink ? p.red : p.paper);
    square(X(between(0.46, 0.54)), H * between(0.72, 0.82), u * 0.14, p.ink);
    ring(X(between(0.93, 0.97)), H * between(0.72, 0.84), p.ink);
  } else if (kind === 1) {
    // ── 斜切的深色场 ──
    const ex = X(between(0.36, 0.46));
    const lean = u * between(0.16, 0.3);
    const fieldColor = rnd() < 0.7 ? p.ink : p.red;
    const discColor = fieldColor === p.ink ? p.red : p.ink;
    const edge0 = flip ? W + 10 : -10;
    ctx.fillStyle = fieldColor;
    ctx.beginPath();
    ctx.moveTo(edge0, -10);
    ctx.lineTo(ex + lean, -10);
    ctx.lineTo(ex - lean, H + 10);
    ctx.lineTo(edge0, H + 10);
    ctx.closePath();
    ctx.fill();

    // 亮的一侧：沿主轴的粗杠和细线，从圆盘伸出去
    const dx = ex + sgn * u * between(0.05, 0.3);
    const dy = H * between(0.44, 0.6);
    const dr = u * between(0.3, 0.42);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rad(theta));
    ctx.fillStyle = p.ink;
    const x0 = flip ? -W * 2 : 0;
    ctx.fillRect(x0, dr * 0.34, W * 2, u * 0.08);
    ctx.fillRect(x0, dr * 0.34 + u * 0.14, W * 2, u * 0.014);
    ctx.restore();
    dot(ctx, dx, dy, dr, discColor);
    ctx.strokeStyle = fieldColor === p.ink ? p.paper : p.ink;
    ctx.lineWidth = u * 0.018;
    const a0 = flip ? between(-60, -30) : between(120, 150);
    ctx.beginPath();
    ctx.arc(dx, dy, dr * 1.2, rad(a0), rad(a0 + between(80, 120)));
    ctx.stroke();

    // 细节漂在深色场上
    details(X(between(0.13, 0.2)), H * between(0.44, 0.54), p.paper, fieldColor === p.ink ? p.red : p.ink);
    // 亮侧的小件
    square(X(between(0.7, 0.8)), H * between(0.24, 0.34), u * 0.26, fieldColor === p.ink ? p.red : p.ink);
    ctx.save();
    ctx.translate(X(between(0.84, 0.9)), H * between(0.2, 0.3));
    ctx.rotate(rad(theta));
    stripes(ctx, -u * 0.3, -u * 0.07, u * 0.6, u * 0.14, u * 0.05, p.ink);
    ctx.restore();
    ring(X(between(0.6, 0.66)), H * between(0.2, 0.3), p.ink);
  } else {
    // ── 一枚大红楔形横贯画面 ──
    const tipX = X(between(0.62, 0.74));
    const tipY = H * between(0.4, 0.56);
    const baseX = flip ? W + 10 : -10;
    ctx.fillStyle = p.red;
    ctx.beginPath();
    ctx.moveTo(baseX, H * between(-0.25, -0.05));
    ctx.lineTo(baseX, H * between(0.9, 1.15));
    ctx.lineTo(tipX, tipY);
    ctx.closePath();
    ctx.fill();

    // 楔尖顶着一个黑圆盘和它的弧
    const dr = u * between(0.26, 0.36);
    const dx = tipX + sgn * dr * 0.55;
    dot(ctx, dx, tipY, dr, p.ink);
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = u * 0.02;
    const a0 = flip ? 100 : -80;
    ctx.beginPath();
    ctx.arc(dx, tipY, dr * 1.24, rad(a0), rad(a0 + 160));
    ctx.stroke();
    ctx.lineWidth = u * 0.008;
    ctx.beginPath();
    ctx.arc(dx, tipY, dr * 1.42, rad(a0 + 20), rad(a0 + 130));
    ctx.stroke();

    // 贯穿的粗杠
    ctx.save();
    ctx.translate(dx, tipY);
    ctx.rotate(rad(theta));
    ctx.fillStyle = p.ink;
    ctx.fillRect(-W * 2, dr * 1.05, W * 4, u * 0.075);
    ctx.fillRect(flip ? -W * 2 : dr * 0.2, dr * 1.05 + u * 0.13, W * 2, u * 0.014);
    ctx.restore();

    details(X(between(0.14, 0.22)), H * between(0.4, 0.5), p.paper, p.ink);
    square(X(between(0.9, 0.95)), H * between(0.22, 0.34), u * 0.14, p.red);
  }

  ctx.restore();
}
