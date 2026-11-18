// 构建时把 ```tikz / ```tikzcd 代码块渲染成 SVG（不需要本机装 LaTeX）。
// 结果按源码哈希缓存在 .cache/tikz，重复构建不会重新跑 TeX。
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit } from 'unist-util-visit';

const CACHE_DIR = join(process.cwd(), '.cache', 'tikz');
const SCALE = 1.5;
const VERSION = 'v2';

// node-tikzjax 不能并发，所有渲染排一条队。
let queue = Promise.resolve();
let enginePromise;

function wrap(source, lang) {
  if (source.includes('\\begin{document}')) return source;
  const preamble = [];
  const body = [];
  for (const line of source.split('\n')) {
    if (/^\s*\\(usepackage|usetikzlibrary|tikzset|newcommand|DeclareMathOperator)\b/.test(line)) {
      preamble.push(line);
    } else {
      body.push(line);
    }
  }
  let content = body.join('\n').trim();
  if (lang === 'tikzcd' && !content.includes('\\begin{tikzcd}')) {
    content = `\\begin{tikzcd}\n${content}\n\\end{tikzcd}`;
  }
  return [
    '\\usepackage{amsmath}',
    '\\usepackage{amssymb}',
    '\\usepackage{tikz-cd}',
    ...preamble,
    '\\begin{document}',
    content,
    '\\end{document}',
  ].join('\n');
}

function polish(svg) {
  return svg
    .replace(/^<svg ([^>]*?)width="([\d.]+)" height="([\d.]+)"/, (_, pre, w, h) => {
      const W = (parseFloat(w) * SCALE).toFixed(2);
      const H = (parseFloat(h) * SCALE).toFixed(2);
      return `<svg ${pre}width="${W}" height="${H}" fill="currentColor" role="img"`;
    })
    .replace(/#000(?:000)?\b/g, 'currentColor');
}

async function render(source) {
  const key = createHash('sha1').update(VERSION + source).digest('hex');
  const cached = join(CACHE_DIR, `${key}.svg`);
  if (existsSync(cached)) return readFileSync(cached, 'utf8');

  enginePromise ??= import('node-tikzjax').then((m) => m.default?.default ?? m.default ?? m);
  const tex2svg = await enginePromise;
  const svg = polish(await tex2svg(source, { showConsole: false }));
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cached, svg);
  return svg;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function remarkTikz() {
  return async (tree, file) => {
    const jobs = [];
    visit(tree, 'code', (node) => {
      if (node.lang === 'tikz' || node.lang === 'tikzcd') jobs.push(node);
    });

    for (const node of jobs) {
      const source = wrap(node.value, node.lang);
      const task = queue.then(() => render(source));
      queue = task.catch(() => {});
      try {
        const svg = await task;
        node.type = 'html';
        node.value = `<figure class="tikz">${svg}</figure>`;
      } catch (err) {
        file.message(`TikZ 渲染失败：${err?.message ?? err}`, node.position);
        node.type = 'html';
        node.value = `<figure class="tikz tikz-error"><figcaption>TikZ 渲染失败</figcaption><pre>${escapeHtml(node.value)}</pre></figure>`;
      }
    }
  };
}
