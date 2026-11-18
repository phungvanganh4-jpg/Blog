#!/usr/bin/env node
// 新建一篇文章：
//   npm run new -- group-theory "子群与陪集"     → 群论系列的下一章（自动编号）
//   npm run new -- post "随便写点什么" my-slug    → 一篇不属于任何系列的文章
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [kind, title, slug] = process.argv.slice(2);
if (!kind || !title) {
  console.log('用法：npm run new -- <系列 key | post> "标题" [文件名]');
  process.exit(1);
}

const root = join(process.cwd(), 'src/content/posts');
const today = new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

let file;
let body;
if (kind === 'post') {
  file = join(root, `${slug ?? today}.md`);
  body = `---\ntitle: ${title}\ndate: ${today}\ntags: []\ndraft: true\n---\n\n`;
} else {
  const dir = join(root, kind);
  mkdirSync(dir, { recursive: true });
  // 下一章的序号 = 现有章节里最大的 order + 1
  const orders = readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => Number(/^order:\s*(\d+)/m.exec(readFileSync(join(dir, f), 'utf8'))?.[1] ?? 0));
  const order = Math.max(0, ...orders) + 1;
  file = join(dir, `${slug ?? pad(order)}.md`);
  const template = join(dir, '_template.md');
  body = existsSync(template)
    ? readFileSync(template, 'utf8')
        .replace(/^title: .*$/m, `title: ${title}`)
        .replace(/^date: .*$/m, `date: ${today}`)
        .replace(/^order: .*$/m, `order: ${order}`)
    : `---\ntitle: ${title}\ndate: ${today}\ntags: []\nseries: ${kind}\norder: ${order}\ndraft: true\n---\n\n`;
}

if (existsSync(file)) {
  console.error(`已经存在：${file}`);
  process.exit(1);
}
writeFileSync(file, body);
console.log(`已创建 ${file.replace(process.cwd() + '/', '')}`);
console.log('写完后删掉 frontmatter 里的 draft: true 就会发布。');
