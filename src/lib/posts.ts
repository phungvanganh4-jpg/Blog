import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 所有已发布文章，新的在前。草稿只在 dev 模式可见。 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 给站内路径补上 base（部署在子路径时才有区别）。 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

export const postUrl = (post: Post) => url(`/posts/${post.id}/`);
export const tagUrl = (tag: string) => url(`/tags/${encodeURIComponent(tag)}/`);
export const seriesUrl = (key: string) => url(`/series/${key}/`);

export function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** 粗略阅读时间：中文按字、英文按词，公式也算一点。 */
export function readingMinutes(body = ''): number {
  const cjk = (body.match(/[一-鿿]/g) ?? []).length;
  const words = (body.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9\\]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 380 + words / 260));
}

export function postsOfSeries(posts: Post[], key: string): Post[] {
  return posts
    .filter((p) => p.data.series === key)
    .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
}
