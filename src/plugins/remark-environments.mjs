// 定理类环境：把
//
//   :::theorem[拉格朗日定理]{#thm-lagrange}
//   ……
//   :::
//
// 变成带自动编号的「定理 2.3（拉格朗日定理）」区块。
// 正文里写 [](#thm-lagrange) 会被自动填成「定理 2.3」。
import { visit, SKIP } from 'unist-util-visit';

const ENVS = {
  definition: { label: '定义', numbered: true, tone: 'def' },
  theorem: { label: '定理', numbered: true, tone: 'thm' },
  lemma: { label: '引理', numbered: true, tone: 'thm' },
  proposition: { label: '命题', numbered: true, tone: 'thm' },
  corollary: { label: '推论', numbered: true, tone: 'thm' },
  example: { label: '例', numbered: true, tone: 'ex' },
  exercise: { label: '习题', numbered: true, tone: 'ex' },
  remark: { label: '注', numbered: false, tone: 'note' },
  note: { label: '注意', numbered: false, tone: 'note' },
  warning: { label: '警告', numbered: false, tone: 'warn' },
  proof: { label: '证明', numbered: false, tone: 'proof' },
};

const ALIASES = {
  def: 'definition',
  defn: 'definition',
  thm: 'theorem',
  lem: 'lemma',
  prop: 'proposition',
  cor: 'corollary',
  ex: 'example',
  eg: 'example',
  rmk: 'remark',
  pf: 'proof',
};

const span = (className, value) => ({
  type: 'strong',
  data: { hName: 'span', hProperties: { className: [className] } },
  children: [{ type: 'text', value }],
});

export default function remarkEnvironments() {
  return (tree, file) => {
    const fm = file.data?.astro?.frontmatter ?? {};
    const prefix = fm.series && Number.isFinite(fm.order) ? `${fm.order}.` : '';
    let counter = 0;
    const refs = new Map();

    visit(tree, (node, index, parent) => {
      // 文中偶然出现的 :foo / ::foo 不是指令，原样还原，避免吞字。
      if (node.type === 'textDirective' || node.type === 'leafDirective') {
        const colons = node.type === 'textDirective' ? ':' : '::';
        const kids = node.children?.length
          ? [{ type: 'text', value: '[' }, ...node.children, { type: 'text', value: ']' }]
          : [];
        const restored = [{ type: 'text', value: colons + node.name }, ...kids];
        if (node.type === 'leafDirective') {
          parent.children[index] = { type: 'paragraph', children: restored };
        } else {
          parent.children.splice(index, 1, ...restored);
        }
        return [SKIP, index];
      }

      if (node.type !== 'containerDirective') return;
      const kind = ALIASES[node.name] ?? node.name;
      const env = ENVS[kind];
      if (!env) return;

      // [标题] 部分
      let titleNodes = null;
      if (node.children[0]?.data?.directiveLabel) {
        titleNodes = node.children.shift().children;
      }

      const id = node.attributes?.id;
      let label = env.label;
      if (env.numbered) {
        counter += 1;
        label = `${env.label} ${prefix}${counter}`;
      }
      if (id) refs.set(id, label);

      node.data = {
        hName: 'section',
        hProperties: {
          className: ['env', `env-${kind}`, `tone-${env.tone}`],
          ...(id ? { id } : {}),
        },
      };

      if (kind === 'proof') {
        // 行内起头：「证明.」；末尾补 ∎
        const head = {
          type: 'strong',
          data: { hName: 'span', hProperties: { className: ['env-runin'] } },
          children: titleNodes ?? [{ type: 'text', value: '证明' }],
        };
        const first = node.children[0];
        if (first?.type === 'paragraph') {
          first.children.unshift(head, { type: 'text', value: ' ' });
        } else {
          node.children.unshift({ type: 'paragraph', children: [head] });
        }
        const last = node.children[node.children.length - 1];
        if (last?.type === 'paragraph') {
          last.children.push(span('qed', '∎'));
        } else {
          node.children.push({
            type: 'paragraph',
            data: { hProperties: { className: ['qed-line'] } },
            children: [span('qed', '∎')],
          });
        }
        return;
      }

      const head = {
        type: 'paragraph',
        data: { hName: 'header', hProperties: { className: ['env-head'] } },
        children: [span('env-label', label)],
      };
      if (titleNodes?.length) {
        head.children.push({
          type: 'emphasis',
          data: { hName: 'span', hProperties: { className: ['env-title'] } },
          children: titleNodes,
        });
      }
      node.children.unshift(head);
    });

    // 交叉引用：[](#id) → 「定理 2.3」
    visit(tree, 'link', (node) => {
      if (!node.url?.startsWith('#')) return;
      const label = refs.get(decodeURIComponent(node.url.slice(1)));
      if (!label) return;
      if (node.children.length === 0) node.children = [{ type: 'text', value: label }];
      node.data = { ...(node.data ?? {}), hProperties: { className: ['ref'] } };
    });
  };
}
