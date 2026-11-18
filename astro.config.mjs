import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import remarkEnvironments from './src/plugins/remark-environments.mjs';
import remarkTikz from './src/plugins/remark-tikz.mjs';
import { katexMacros } from './src/plugins/katex-macros.mjs';

// 部署地址由环境变量决定，不用改代码：
//   SITE_URL  站点的完整域名，如 https://you.github.io
//   BASE_PATH 子路径，如 /blog；部署在根路径就不用设
// GitHub Actions（.github/workflows/deploy.yml）会按仓库自动填好这两个值。
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  base: process.env.BASE_PATH || '/',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  markdown: {
    processor: unified({
      smartypants: false,
      remarkRehype: { footnoteLabel: '脚注', footnoteBackLabel: '回到正文' },
      remarkPlugins: [remarkMath, remarkDirective, remarkEnvironments, remarkTikz],
      rehypePlugins: [
        [
          rehypeKatex,
          {
            macros: katexMacros,
            strict: false,
            trust: true,
            throwOnError: false,
            errorColor: '#e5484d',
          },
        ],
      ],
    }),
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
