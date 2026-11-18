// 自由群 F₂ = ⟨a, b⟩ 的 Cayley 图，画在双曲平面（Poincaré 圆盘）里。
//
// 它是一棵无限的 4 叉树，处处长得一样（递归）；
// 群用左乘作用在自己的 Cayley 图上，所以把整张图沿 a 的轴平移「一步」之后，
// 得到的图和原来的完全重合 —— 动画因此可以无缝循环：
// 每个周期里，整棵树沿 a 流过一步，新的分支不断从左边的无穷远处长出来。

/** 单位圆盘的保向等距（Möbius 变换）z ↦ (αz + β) / (β̄z + ᾱ)，存成 [Re α, Im α, Re β, Im β] */
type Mobius = [number, number, number, number];

function mul(m: Mobius, n: Mobius): Mobius {
  const [ar, ai, br, bi] = m;
  const [cr, ci, dr, di] = n;
  return [
    ar * cr - ai * ci + br * dr + bi * di,
    ar * ci + ai * cr + bi * dr - br * di,
    ar * dr - ai * di + br * cr + bi * ci,
    ar * di + ai * dr + bi * cr - br * ci,
  ];
}

/** 沿方向 phi 平移双曲距离 delta */
function translate(delta: number, phi: number): Mobius {
  const s = Math.sinh(delta / 2);
  return [Math.cosh(delta / 2), 0, s * Math.cos(phi), s * Math.sin(phi)];
}

/** 一步的长度：取 sinh(D/2) = 1，这时四个生成元的像正好把圆盘铺满（基本域是理想四边形） */
const STEP = 2 * Math.asinh(1);
const DIRS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // a, b, a⁻¹, b⁻¹
const GEN: Mobius[] = DIRS.map((phi) => translate(STEP, phi));
const SUB = [0.2, 0.4, 0.6, 0.8]; // 画测地线时中间取的点
const PART: Mobius[][] = DIRS.map((phi) => SUB.map((u) => translate(STEP * u, phi)));

const WIDTHS = [0.7, 1, 1.5, 2.2, 3.2, 4.6, 6.5, 9, 12];

export interface TreeStyle {
  /** a 方向的边（沿流动方向） */
  a: string;
  /** b 方向的边 */
  b: string;
  node: string;
  /** 基本域的边界（一圈套一圈的弧）。不给就不画 */
  tile?: string;
}

export interface TreeOptions {
  /** 整张图的旋转（度），让 a 的轴对上海报的斜轴 */
  rotate?: number;
  /** 小于这个像素长度的边不画，递归到此为止 */
  minLen?: number;
  /** 线宽系数 */
  weight?: number;
}

/**
 * 在以 (cx, cy) 为圆心、半径 R 的圆盘里画 Cayley 树。
 * @param tau 0→1 为一个周期：整棵树沿 a 平移一步。tau 与 tau+1 画出来的图完全相同。
 */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  tau: number,
  style: TreeStyle,
  opts: TreeOptions = {},
) {
  const minLen = opts.minLen ?? 2.4;
  const weight = opts.weight ?? 1;
  const rot = ((opts.rotate ?? 0) * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  // 每种线宽、每种边各攒一条路径，最后一次性描边
  const paths: Path2D[][] = [WIDTHS.map(() => new Path2D()), WIDTHS.map(() => new Path2D())];
  const used: boolean[][] = [WIDTHS.map(() => false), WIDTHS.map(() => false)];
  const nodes = new Path2D();
  const tiles = [new Path2D(), new Path2D(), new Path2D()];
  let budget = 9000;

  const X = (m: Mobius) => {
    const n = m[0] * m[0] + m[1] * m[1];
    return (m[2] * m[0] - m[3] * m[1]) / n;
  };
  const Y = (m: Mobius) => {
    const n = m[0] * m[0] + m[1] * m[1];
    return (m[2] * m[1] + m[3] * m[0]) / n;
  };
  const sx = (x: number, y: number) => cx + (x * cosR - y * sinR) * R;
  const sy = (x: number, y: number) => cy + (x * sinR + y * cosR) * R;

  /**
   * 每条边 g — gs 都被一条「墙」垂直平分：它是 g 和 gs 两个基本域的公共边，
   * 一条两端都伸到无穷远（圆周）的测地线。所有的墙合起来把圆盘铺成理想四边形。
   */
  function dual(m: Mobius, s: number) {
    const [ar, ai, br, bi] = m;
    const ends: number[] = [];
    for (const d of [Math.PI / 4, -Math.PI / 4]) {
      const zr = Math.cos(DIRS[s] + d);
      const zi = Math.sin(DIRS[s] + d);
      // w = (αz + β) / (β̄z + ᾱ)
      const nr = ar * zr - ai * zi + br;
      const ni = ar * zi + ai * zr + bi;
      const dr = br * zr + bi * zi + ar;
      const di = br * zi - bi * zr - ai;
      ends.push(Math.atan2(ni * dr - nr * di, nr * dr + ni * di));
    }
    let delta = ends[1] - ends[0];
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const h = Math.abs(delta) / 2; // 两个端点张角的一半
    const mid = ends[0] + delta / 2 + rot;
    const r = Math.tan(h) * R;
    if (r < minLen * 0.6) return;
    const path = tiles[r > R * 0.5 ? 2 : r > R * 0.12 ? 1 : 0];
    if (h > 1.5) {
      // 几乎是直径：直接连直线
      path.moveTo(cx + R * Math.cos(ends[0] + rot), cy + R * Math.sin(ends[0] + rot));
      path.lineTo(cx + R * Math.cos(ends[1] + rot), cy + R * Math.sin(ends[1] + rot));
      return;
    }
    const ox = cx + (R * Math.cos(mid)) / Math.cos(h);
    const oy = cy + (R * Math.sin(mid)) / Math.cos(h);
    const half = Math.PI / 2 - h;
    const a0 = mid + Math.PI - half;
    path.moveTo(ox + r * Math.cos(a0), oy + r * Math.sin(a0));
    path.arc(ox, oy, r, a0, mid + Math.PI + half);
  }

  function walk(m: Mobius, px: number, py: number, from: number, depth: number) {
    // 顶点：越靠近圆盘边缘越小
    const scale = 1 - px * px - py * py;
    const nr = R * 0.028 * scale * weight;
    if (nr > 0.6) {
      const x = sx(px, py);
      const y = sy(px, py);
      nodes.moveTo(x + nr, y);
      nodes.arc(x, y, nr, 0, Math.PI * 2);
    }

    for (let s = 0; s < 4; s++) {
      if (from >= 0 && s === (from + 2) % 4) continue; // 不走回头路
      const child = mul(m, GEN[s]);
      const qx = X(child);
      const qy = Y(child);
      const len = Math.hypot(qx - px, qy - py) * R;
      if (len < minLen || budget-- <= 0) continue;

      if (style.tile) dual(m, s);

      // 线宽跟着边的长度走
      const w = Math.max(0.7, len * (s % 2 === 0 ? 0.04 : 0.026)) * weight;
      let k = 0;
      while (k < WIDTHS.length - 1 && WIDTHS[k] < w) k++;
      const kind = s % 2;
      const path = paths[kind][k];
      used[kind][k] = true;
      path.moveTo(sx(px, py), sy(px, py));
      if (len > 18) {
        // 长边沿测地线细分，才是弧而不是弦
        for (const part of PART[s]) {
          const mid = mul(m, part);
          const mx = X(mid);
          const my = Y(mid);
          path.lineTo(sx(mx, my), sy(mx, my));
        }
      }
      path.lineTo(sx(qx, qy), sy(qx, qy));

      if (depth < 11) walk(child, qx, qy, s, depth + 1);
    }
  }

  const t = tau - Math.floor(tau);
  const root = translate(STEP * t, 0);
  walk(root, X(root), Y(root), -1, 0);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style.tile) {
    ctx.strokeStyle = style.tile;
    [0.9, 1.6, 2.6].forEach((w, i) => {
      ctx.lineWidth = w * weight;
      ctx.stroke(tiles[i]);
    });
  }
  for (let kind = 1; kind >= 0; kind--) {
    ctx.strokeStyle = kind === 0 ? style.a : style.b;
    for (let k = 0; k < WIDTHS.length; k++) {
      if (!used[kind][k]) continue;
      ctx.lineWidth = WIDTHS[k];
      ctx.stroke(paths[kind][k]);
    }
  }
  ctx.fillStyle = style.node;
  ctx.fill(nodes);
}
