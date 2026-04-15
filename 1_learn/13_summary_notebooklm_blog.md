# next/font によるフォント最適化

## Google Fonts のセルフホスト

従来は Google Fonts を使うとブラウザから Google のサーバーにリクエストが飛んでいた。`next/font/google` を使うと、**ビルド時にフォントファイルを静的アセットとして取得**し、自分のドメインから配信する。

- ユーザーのブラウザから Google へのリクエストが発生しない
- サードパーティへのデータ露出リスクを排除
- 外部ドメインへの DNS ルックアップ・接続オーバーヘッドも解消

## レイアウトシフトの解消

従来の Webフォントは外部サーバーとのハンドシェイクによってフォント適用が遅れ、レンダリング済みテキストが後から再描画される原因になっていた。next/font はフォントをローカルで管理するため、最初から正しいフォントで描画できる。

## ローカルフォント（next/font/local）

独自フォントや有料フォントも簡潔に設定できる。

- `public` フォルダだけでなく `app` フォルダ内への配置も可能
- 複数ウェイト・スタイルは `src` に配列を渡すだけ

```ts
const myFont = localFont({
  src: [
    { path: './font-light.woff2', weight: '300' },
    { path: './font-bold.woff2', weight: '700' },
  ],
})
```

## 可変フォント（Variable Fonts）推奨

単一ファイルで太さやスタイルを制御できるため、リクエスト数を最小限に抑えられる。可変フォントが使えない場合は `weight` の指定が必須。

```ts
const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})
```

## 適用範囲の制御

| 適用範囲 | 方法 |
|---|---|
| コンポーネント単位 | 対象要素に `className` を渡す |
| サイト全体 | `app/layout.tsx` の `<html>` または `<body>` に渡す |

```ts
// app/layout.tsx
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```
