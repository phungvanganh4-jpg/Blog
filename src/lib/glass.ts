// 首页的「液态玻璃」：几滴会融合的玻璃液珠漂在海报上，
// 把下面的图形和文字折射、放大，并在边缘色散出彩虹。
//
// 做法：海报（见 poster.ts）先画进一张 2D canvas 当作纹理；
// WebGL 片元着色器里用 metaball 场算出液珠的高度和法线，
// 再按法线偏移去采样纹理（不同波长偏移量不同 → 色散）。

const N = 7; // 液珠数量（最后一颗跟随指针）

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
#define N ${N}
#define SAMPLES 16

uniform vec2 u_res;
uniform float u_time;
uniform float u_light;      // 0 = 暗色主题, 1 = 亮色主题
uniform sampler2D u_tex;
uniform vec3 u_blobs[N];    // xy = 位置（以画布高度为 1 的单位），z = 半径

float field(vec2 p) {
  float f = 0.0;
  for (int i = 0; i < N; i++) {
    vec2 d = p - u_blobs[i].xy;
    f += u_blobs[i].z * u_blobs[i].z / (dot(d, d) + 1e-5);
  }
  return f;
}

// 液珠的高度剖面：边缘陡、向中心平滑地变平，像一滴水（处处光滑，没有折痕）
float height(vec2 p) {
  float t = 1.0 - exp(-max(field(p) - 1.0, 0.0) / 0.42);
  return sqrt(1.0 - (1.0 - t) * (1.0 - t));
}

vec3 spectrum(float t) {
  return max(vec3(0.0), 1.0 - abs(t - vec3(1.0, 0.5, 0.0)) * 2.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 sampleBg(vec2 p) {
  vec2 uv = p * vec2(u_res.y / u_res.x, 1.0);
  return texture2D(u_tex, clamp(uv, 0.0, 1.0)).rgb;
}

void main() {
  vec2 p = gl_FragCoord.xy / u_res.y;
  vec3 bg = sampleBg(p);

  float f = field(p);

  // 液珠投在「纸面」上的一点影子（亮色主题下才看得出来）
  float sh = smoothstep(0.55, 1.05, field(p + vec2(-0.006, 0.012)));
  bg *= 1.0 - 0.16 * sh * u_light;

  // 纸的颗粒
  float grain = (hash(gl_FragCoord.xy * 0.71) - 0.5) * 0.034;

  if (f < 0.98) {
    gl_FragColor = vec4(bg + grain, 1.0);
    return;
  }

  float e = 1.5 / u_res.y;
  float h = height(p);
  vec2 grad = vec2(
    height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0)),
    height(p + vec2(0.0, e)) - height(p - vec2(0.0, e))
  ) / (2.0 * e);
  vec3 n = normalize(vec3(-grad * 0.085, 1.0));

  // 折射 + 色散：沿法线方向向内偏移采样，不同「波长」偏移量不同
  vec3 acc = vec3(0.0);
  vec3 wsum = vec3(0.0);
  float jitter = hash(gl_FragCoord.xy);   // 抖动一下采样位置，消除色带
  for (int i = 0; i < SAMPLES; i++) {
    float t = (float(i) + jitter) / float(SAMPLES);
    float k = 0.046 * (1.0 + 0.55 * (t - 0.5));
    vec3 w = spectrum(t);
    acc += sampleBg(p - n.xy * k) * w;
    wsum += w;
  }
  vec3 col = acc / wsum;

  // 高光与薄膜干涉
  vec3 v = vec3(0.0, 0.0, 1.0);
  float fres = pow(1.0 - n.z, 2.2);
  float spec = pow(max(dot(n, normalize(vec3(-0.55, 0.75, 0.55) + v)), 0.0), 110.0);
  float spec2 = pow(max(dot(n, normalize(vec3(0.6, -0.55, 0.5) + v)), 0.0), 26.0);
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fres * 1.1 + n.x * 0.35 - n.y * 0.25 + u_time * 0.035));

  vec3 dark = col + mix(irid, vec3(1.0), 0.18) * fres * 0.8 + vec3(0.03) * h + spec * 1.3 + spec2 * 0.1;
  vec3 light = mix(col * (1.0 - fres * 0.3), irid, fres * 0.5) + spec * 0.9 + spec2 * 0.1;
  col = mix(dark, light, u_light);

  float mask = smoothstep(0.98, 1.03, f);
  gl_FragColor = vec4(mix(bg, col, mask) + grain * 0.6, 1.0);
}
`;

interface Blob {
  x: number;
  y: number;
  r: number;
}

export interface GlassOptions {
  /** 把背景（海报）画进给定的 2D canvas；尺寸变化或主题切换时会被重新调用 */
  paint: (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, seconds: number) => void;
  /** 海报本身一直在动：每帧都重画并重新上传纹理 */
  live?: boolean;
  /** 画布分辨率上限（devicePixelRatio），live 的时候可以调低省一点 */
  maxDpr?: number;
  /** 进场动画时长（毫秒）。期间每帧重画海报，progress 从 0 走到 1；不给就没有进场动画 */
  intro?: number;
  /** 液珠大小的倍数（横幅这种扁画布上要放大一些） */
  scale?: number;
  /** 自己漂的液珠数量，最多 6 颗 */
  count?: number;
  /** 时间偏移（秒）：让不同画布上的液珠不在同一个位置 */
  phase?: number;
}

export function mountGlass(canvas: HTMLCanvasElement, opts: GlassOptions): (() => void) | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uLight = gl.getUniformLocation(prog, 'u_light');
  const uBlobs = gl.getUniformLocation(prog, 'u_blobs');

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const paper = document.createElement('canvas');
  const pctx = paper.getContext('2d')!;

  let W = 0;
  let H = 0;
  let light = 0;
  let alive = true;
  let visible = true;
  let raf = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let dprCap = opts.maxDpr ?? 2;
  // live 模式下盯着帧时间：机器吃力就把分辨率降一档
  let slowFrames = 0;
  let lastFrame = 0;
  let introDone = !opts.intro || reduced;
  const introProgress = () => (introDone ? 1 : Math.min(1, (performance.now() - t0) / opts.intro!));

  /** 把海报画进纹理 */
  function paint() {
    light = document.documentElement.dataset.theme === 'dark' ? 0 : 1;
    paper.width = W;
    paper.height = H;
    opts.paint(pctx, W, H, introProgress(), reduced ? 0 : (performance.now() - t0) / 1000);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, paper);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    if (w === W && h === H) return;
    W = canvas.width = w;
    H = canvas.height = h;
    gl!.viewport(0, 0, W, H);
    paint();
    if (reduced) draw(performance.now());
  }

  // 指针液珠
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, r: 0, tr: 0 };
  const blobs: Blob[] = Array.from({ length: N }, () => ({ x: 0, y: 0, r: 0 }));
  const data = new Float32Array(N * 3);

  // 每颗液珠的漂移参数（固定的，不是随机的，保证每次打开构图一致）
  const drift = [
    { ax: 0.42, ay: 0.3, fx: 0.11, fy: 0.083, px: 0.0, py: 1.3, r: 0.15 },
    { ax: 0.38, ay: 0.34, fx: 0.071, fy: 0.127, px: 2.1, py: 0.4, r: 0.115 },
    { ax: 0.46, ay: 0.28, fx: 0.093, fy: 0.059, px: 4.0, py: 2.7, r: 0.09 },
    { ax: 0.32, ay: 0.38, fx: 0.137, fy: 0.101, px: 5.2, py: 4.1, r: 0.07 },
    { ax: 0.48, ay: 0.4, fx: 0.053, fy: 0.149, px: 1.1, py: 5.5, r: 0.052 },
    { ax: 0.26, ay: 0.22, fx: 0.167, fy: 0.113, px: 3.3, py: 3.0, r: 0.08 },
  ];

  function draw(now: number) {
    const t = (reduced ? 8 : (now - t0) / 1000 + 8) + (opts.phase ?? 0);
    const aspect = W / H;
    // 竖屏上按宽度把液珠缩小一些
    const scale = Math.min(1, 0.26 + aspect * 0.52) * (opts.scale ?? 1);
    const count = opts.count ?? drift.length;

    drift.forEach((d, i) => {
      blobs[i].x = aspect * (0.5 + d.ax * Math.sin(t * d.fx + d.px));
      blobs[i].y = 0.5 + d.ay * Math.cos(t * d.fy + d.py);
      blobs[i].r = i < count ? d.r * scale * (1 + 0.07 * Math.sin(t * 0.4 + i)) : 0;
    });

    pointer.x += (pointer.tx - pointer.x) * 0.09;
    pointer.y += (pointer.ty - pointer.y) * 0.09;
    pointer.r += (pointer.tr - pointer.r) * 0.07;
    const pb = blobs[N - 1];
    pb.x = pointer.x * aspect;
    pb.y = pointer.y;
    pb.r = pointer.r;

    blobs.forEach((b, i) => {
      data[i * 3] = b.x;
      data[i * 3 + 1] = b.y;
      data[i * 3 + 2] = b.r;
    });

    gl!.uniform2f(uRes, W, H);
    gl!.uniform1f(uTime, t);
    gl!.uniform1f(uLight, light);
    gl!.uniform3fv(uBlobs, data);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function frame(now: number) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    if (opts.live && !reduced) {
      if (lastFrame && now - lastFrame > 34) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      lastFrame = now;
      if (slowFrames > 40 && dprCap > 1) {
        dprCap = 1;
        slowFrames = 0;
        resize();
      }
      paint();
    } else if (!introDone) {
      // 进场期间海报本身在动，每帧重画并重新上传纹理
      paint();
      if (introProgress() >= 1) introDone = true;
    }
    draw(now);
  }

  function onMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width;
    pointer.ty = 1 - (e.clientY - r.top) / r.height;
    const inside = e.clientY >= r.top && e.clientY <= r.bottom;
    pointer.tr = inside && e.pointerType !== 'touch' ? 0.085 * Math.min(opts.scale ?? 1, 1.6) : 0;
    if (reduced) draw(performance.now());
  }
  const onDown = () => pointer.tr > 0 && (pointer.tr *= 1.5);
  const onUp = () => pointer.tr > 0 && (pointer.tr /= 1.5);
  const onLeave = () => (pointer.tr = 0);
  const onTheme = () => {
    paint();
    if (reduced) draw(performance.now());
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  document.addEventListener('themechange', onTheme);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
  io.observe(canvas);

  resize();
  if (reduced) draw(performance.now());
  else raf = requestAnimationFrame(frame);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('themechange', onTheme);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
