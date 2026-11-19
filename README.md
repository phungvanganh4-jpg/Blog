# 博客

网址：https://phungvanganh4-jpg.github.io/Blog/

推送到 `main` 之后大约一分钟自动更新（见 Actions 页）。

## 写文章

文章就是 `src/content/posts/` 里的 Markdown 文件，文件名决定网址（`my-post.md` → `/posts/my-post/`）。

### 在网页上写（最省事）

- [新建一篇文章](https://github.com/phungvanganh4-jpg/Blog/new/main/src/content/posts?filename=my-post.md&value=---%0Atitle%3A%20%E6%A0%87%E9%A2%98%0Adate%3A%202026-01-01%0Atags%3A%20%5B%5D%0A---%0A%0A%E6%AD%A3%E6%96%87%E4%BB%8E%E8%BF%99%E9%87%8C%E5%BC%80%E5%A7%8B%E3%80%82%0A)
- [新建 Group Theory 的一章](https://github.com/phungvanganh4-jpg/Blog/new/main/src/content/posts/group-theory?filename=02.md&value=---%0Atitle%3A%20%E6%A0%87%E9%A2%98%0Adate%3A%202026-01-01%0Atags%3A%20%5B%E7%BE%A4%E8%AE%BA%5D%0Aseries%3A%20group-theory%0Aorder%3A%201%0A---%0A%0A%3C%21--%20%E5%86%99%E5%AE%8C%E5%90%8E%E5%88%A0%E6%8E%89%E4%B8%8A%E9%9D%A2%E7%9A%84%20draft%3A%20true%20%E5%B0%B1%E4%BC%9A%E5%8F%91%E5%B8%83%E3%80%82%E4%B8%8B%E9%9D%A2%E6%98%AF%E5%B8%B8%E7%94%A8%E5%86%99%E6%B3%95%EF%BC%8C%E7%94%A8%E4%B8%8D%E5%88%B0%E7%9A%84%E7%9B%B4%E6%8E%A5%E5%88%A0%E3%80%82%20--%3E%0A%0A%23%23%20%E5%B0%8F%E8%8A%82%E6%A0%87%E9%A2%98%0A%0A%E8%A1%8C%E5%86%85%E5%85%AC%E5%BC%8F%20%24ab%20%3D%20ba%24%EF%BC%8C%E8%A1%8C%E9%97%B4%E5%85%AC%E5%BC%8F%EF%BC%9A%0A%0A%24%24%0A%5Cabs%7BG%7D%20%3D%20%5BG%20%3A%20H%5D%20%5Ccdot%20%5Cabs%7BH%7D%0A%24%24%0A%0A%3A%3A%3Adefinition%5B%E5%90%8D%E7%A7%B0%5D%7B%23def-xxx%7D%0A%E5%AE%9A%E4%B9%89%E7%9A%84%E5%86%85%E5%AE%B9%E3%80%82%0A%3A%3A%3A%0A%0A%3A%3A%3Atheorem%5B%E5%90%8D%E7%A7%B0%5D%7B%23thm-xxx%7D%0A%E5%AE%9A%E7%90%86%E7%9A%84%E5%86%85%E5%AE%B9%E3%80%82%0A%3A%3A%3A%0A%0A%3A%3A%3Aproof%0A%E8%AF%81%E6%98%8E%E3%80%82%E5%BC%95%E7%94%A8%E5%88%AB%E5%A4%84%E5%86%99%20%5B%5D%28%23thm-xxx%29%E3%80%82%0A%3A%3A%3A%0A%0A%3C%21--%20%E8%BF%98%E6%9C%89%20lemma%20/%20proposition%20/%20corollary%20/%20example%20/%20remark%20/%20warning%EF%BC%9B%0A%20%20%20%20%20%E4%BA%A4%E6%8D%A2%E5%9B%BE%E7%94%A8%20%60%60%60tikzcd%20%E4%BB%A3%E7%A0%81%E5%9D%97%EF%BC%8C%E4%BB%BB%E6%84%8F%E5%9B%BE%E7%94%A8%20%60%60%60tikz%20%E4%BB%A3%E7%A0%81%E5%9D%97%E3%80%82%20--%3E%0A)

点开后改三处：右上角的文件名、`title`、`date`（Group Theory 的章节还要改 `order`，它是第几章）。
写完点 **Commit changes**，等一分钟就上线。改旧文章：在仓库里打开那个文件，点右上角的铅笔。

文件开头两行 `---` 之间的部分必须保留，`title` 和 `date` 不能少，否则这次更新会失败、网站停在上一版（GitHub 会发邮件提醒）。

暂时不想公开的文章，在开头加一行 `draft: true`；删掉这一行就发布。
注意仓库是公开的：草稿不会出现在网站上，但在 GitHub 上能被看到。

### 在自己电脑上写

```bash
npm install
npm run dev                                   # 本地预览，草稿也能看到
npm run new -- post "标题" my-post            # 新建一篇文章
npm run new -- group-theory "子群与陪集"      # 新建 Group Theory 的下一章，自动编号
git add -A && git commit -m "新文章" && git push
```

### 写法

普通 Markdown。数学公式：行内 `$ab = ba$`，独占一行用 `$$ ... $$`。

定义、定理、证明：

```markdown
:::theorem[Lagrange]{#thm-lagrange}
设 $G$ 是有限群，$H \le G$，则 $\abs{G} = [G : H] \cdot \abs{H}$。
:::

:::proof
证明写这里。引用写 [](#thm-lagrange)，会自动变成「定理 1」。
:::
```

可用的有 `definition` `theorem` `lemma` `proposition` `corollary` `example` `remark` `warning` `proof`。
交换图用 `tikzcd` 代码块，任意图用 `tikz` 代码块。更完整的例子见 `src/content/posts/hello.md`。

## 其他

- 名字、简介、链接：`src/site.config.ts`
- 全站 LaTeX 宏（`\Z`、`\Aut`、`\gen{a,b}` 等）：`src/plugins/katex-macros.mjs`
