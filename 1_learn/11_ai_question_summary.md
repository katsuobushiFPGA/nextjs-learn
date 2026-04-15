# CSS Modules vs Vue Scoped CSS

## 概要

CSS Modules（Next.js）と Vue の scoped CSS は、**どちらもスタイルをコンポーネントにローカルスコープする**という目的は同じ。ただし仕組みが異なる。

---

## 仕組みの違い

| | CSS Modules | Vue scoped CSS |
|---|---|---|
| スコープの方法 | クラス名をユニーク文字列に変換 | 属性セレクタを付与 |
| 変換後の例 | `.blog` → `.blog_abc123__xyz` | `.blog[data-v-7ba5bd90]` |
| 記述場所 | 別ファイル（`.module.css`） | 同一ファイル（`<style scoped>`） |
| 参照方法 | `styles.blog` でオブジェクト経由 | `class="blog"` そのまま |

---

## 変換後のイメージ

### Vue scoped CSS

```html
<!-- HTML -->
<main class="blog" data-v-7ba5bd90></main>
```

```css
/* 変換後の CSS */
.blog[data-v-7ba5bd90] {
  padding: 24px;
}
```

### CSS Modules

```html
<!-- HTML -->
<main class="blog_abc123__xyz"></main>
```

```css
/* 変換後の CSS */
.blog_abc123__xyz {
  padding: 24px;
}
```

---

## Next.js での使い方

```css
/* app/blog/blog.module.css */
.blog {
  padding: 24px;
}
```

```tsx
// app/blog/page.tsx
import styles from './blog.module.css'

export default function Page() {
  return <main className={styles.blog}></main>
}
```

---

## 実用上の注意点

- CSS Modules はクラス名を `styles.blog` のようにオブジェクト経由で参照する必要がある
- 文字列として直接 `className="blog"` と書いてもスコープが効かない
- Vue scoped に慣れていると最初は少し不便に感じる
