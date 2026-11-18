# 博客

Astro 静态站点。构成主义海报 + 液态玻璃；公式用 KaTeX，交换图用 TikZ，都在构建时渲染。

```bash
npm install
npm run dev      # 本地预览（草稿可见）
npm run build    # 生成 dist/
```

## 写文章

```bash
npm run new -- group-theory "子群与陪集"   # 群论系列的下一章，自动编号
npm run new -- post "标题" my-slug          # 不属于系列的文章
```

文章在 `src/content/posts/`。新建的文章带 `draft: true`，删掉这一行才会发布。
写法示例见 `src/content/posts/group-theory/_template.md`。

- 名字、简介、链接：`src/site.config.ts`
- 全站 LaTeX 宏：`src/plugins/katex-macros.mjs`

## 部署

推送到 `main` 后由 `.github/workflows/deploy.yml` 自动发布到 GitHub Pages。
