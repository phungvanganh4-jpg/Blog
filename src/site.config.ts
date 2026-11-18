// 站点信息都在这一个文件里。

export const site = {
  /** 名字：首页大字、页眉、浏览器标签 */
  name: 'Alexy',
  /** 一句话简介，可留空 */
  bio: '',
  /** 建站年份 */
  since: 2026,
  /** 链接：留空的不显示 */
  links: {
    GitHub: '',
    Email: '',
    X: '',
    知乎: '',
    Bilibili: '',
  } as Record<string, string>,
};

/**
 * 系列。文章 frontmatter 里写 series: <key> 和 order: <第几篇>。
 * hero: 'cayley' 的系列页用 Cayley 树动画当头图；不写就用普通的封面横幅。
 */
export const seriesMeta: Record<string, { title: string; hero?: 'cayley' }> = {
  'group-theory': { title: '群论', hero: 'cayley' },
};

export const links = Object.entries(site.links)
  .filter(([, v]) => v)
  .map(([label, v]) => ({
    label,
    href: label === 'Email' && !v.startsWith('mailto:') ? `mailto:${v}` : v,
  }));
