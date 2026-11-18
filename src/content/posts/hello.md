---
title: 排版测试
date: 2026-11-18
tags: [测试]
---

这篇是示例，用来检查公式、定理环境和图的渲染，可以直接删掉。

## 公式

行内 $e^{i\pi} + 1 = 0$，同态 $\varphi\colon G \to H$ 的核 $\ker\varphi \normal G$。

$$
\abs{G} = \abs{Z(G)} + \sum_{i=1}^{r} [G : C_G(g_i)]
$$

$$
\begin{aligned}
(ab)(b\inv a\inv) &= a(bb\inv)a\inv \\
                  &= aa\inv = e
\end{aligned}
\tag{1}
$$

$$
\sgn(\sigma) =
\begin{cases}
+1, & \sigma \text{ 是偶置换} \\
-1, & \sigma \text{ 是奇置换}
\end{cases}
\qquad
\begin{pmatrix} 1 & 2 & 3 \\ 2 & 3 & 1 \end{pmatrix} = (1\ 2\ 3)
$$

## 定理环境

:::definition[子群]{#def-subgroup}
设 $G$ 是群，$H \subseteq G$ 非空。若 $H$ 在 $G$ 的运算下也是群，称 $H$ 为 $G$ 的**子群**，记作 $H \le G$。
:::

:::theorem[Lagrange]{#thm-lagrange}
设 $G$ 是有限群，$H \le G$，则

$$
\abs{G} = [G : H] \cdot \abs{H}.
$$
:::

:::proof
$H$ 的左陪集两两不交、大小都等于 $\abs{H}$，并且覆盖 $G$。
:::

:::corollary{#cor-order}
有限群中每个元素的阶整除群的阶。
:::

:::example
由 [](#thm-lagrange)，素数阶群没有非平凡子群，因此是循环群。
:::

:::remark
[](#thm-lagrange) 的逆命题不成立：$A_4$ 没有 $6$ 阶子群。
:::

## 图

```tikzcd
G \arrow[r, "\varphi"] \arrow[d, "\pi"', two heads] & H \\
G/\ker\varphi \arrow[ru, "\bar\varphi"', hook, dashed]
```

```tikz
\begin{tikzpicture}[every node/.style={inner sep=3pt}]
  \node (G)   at (0, 3.2)    {$D_3$};
  \node (R)   at (-2.6, 1.8) {$\langle r \rangle$};
  \node (S)   at (-0.5, 1.2) {$\langle s \rangle$};
  \node (SR)  at (1.1, 1.2)  {$\langle sr \rangle$};
  \node (SRR) at (2.8, 1.2)  {$\langle sr^2 \rangle$};
  \node (E)   at (0, -0.4)   {$\{e\}$};
  \draw (G) -- (R) -- (E) -- (S) -- (G) -- (SR) -- (E) -- (SRR) -- (G);
\end{tikzpicture}
```

| $\cdot$ | $e$ | $a$ | $b$ | $c$ |
| :-: | :-: | :-: | :-: | :-: |
| $e$ | $e$ | $a$ | $b$ | $c$ |
| $a$ | $a$ | $e$ | $c$ | $b$ |
| $b$ | $b$ | $c$ | $e$ | $a$ |
| $c$ | $c$ | $b$ | $a$ | $e$ |

## 代码

```python
def order(a, mul, e):
    n, x = 1, a
    while x != e:
        x, n = mul(x, a), n + 1
    return n
```
