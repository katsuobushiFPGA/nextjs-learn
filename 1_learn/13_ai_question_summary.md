# next/font まとめ

## 仕組み

`next/font` はフォントを自動的にセルフホストし、`className` または CSS変数として提供する。

`className` を `<html>` タグに指定すると、Next.js がユニークなクラス名を生成してスタイルを注入する。

```css
@font-face {
  font-family: 'Geist';
  src: url('/_next/static/media/xxxx.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

.__className_abc123 {
  font-family: 'Geist', sans-serif;
}
```

```html
<html lang="en" class="__className_abc123">
```

セレクタは `html {}` ではなく `.__className_abc123 {}` だが、`<html>` にクラスが付くので CSS の継承によって全子孫要素にフォントが伝播する。

---

## className vs variable

| アプローチ | 何をするか | 使いどころ |
|---|---|---|
| `className` | font-family を直接適用 | 単一フォントをサイト全体に |
| `variable` | CSS変数に値を格納 | 複数フォントを使い分ける・Tailwind と組み合わせる |

### className

```ts
const geist = Geist({ subsets: ['latin'] })
// → <html className={geist.className}>
```

### variable

```ts
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = GeistMono({ subsets: ['latin'], variable: '--font-geist-mono' })
```

```css
/* 出力されるCSS */
.__variable_abc123 {
  --font-geist: 'Geist', sans-serif;
}
.__variable_def456 {
  --font-geist-mono: 'Geist Mono', monospace;
}
```

CSS変数の中身は `font-family` の値。変数名自体に特別な意味はなく、`variable` オプションで指定した名前がそのまま使われる。

使うときは `var()` で参照する：

```css
.code {
  font-family: var(--font-geist-mono);
}
```

---

## Tailwind v4 との組み合わせ

Tailwind v4 からは `tailwind.config.js` が廃止され、CSS 側で設定する。

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --font-sans: var(--font-geist);
  --font-mono: var(--font-geist-mono);
}
```

`@theme` ブロックで Tailwind のデザイントークンを上書き・追加する。`--font-sans` / `--font-mono` は Tailwind が予約している変数名で、上書きすると `font-sans` / `font-mono` クラスの中身が差し替わる。

これにより本文と等幅フォントをクラスで使い分けられる：

```html
<p class="font-sans">本文テキスト</p>
<code class="font-mono">コードブロック</code>
```
