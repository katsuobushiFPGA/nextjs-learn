# Next.js 16 メタデータと OG 画像まとめ

## メタデータ定義の3つのアプローチ

すべて Server Components でのみサポート。

### 1. 静的メタデータ

`layout.js` または `page.js` から `Metadata` オブジェクトをエクスポートする。固定のタイトル・説明を持つページ向け。

### 2. 動的メタデータ

`generateMetadata` 関数で外部データ（fetch 等）に基づいてメタデータを生成する。記事ページなどデータに依存するページ向け。

### 3. ファイルベースのメタデータ

特定のファイル名を置くだけで Next.js が自動的に関連タグを生成する。

| ファイル | 用途 |
|---|---|
| `favicon.ico`, `apple-icon.jpg` | ファビコン |
| `opengraph-image.jpg`, `twitter-image.jpg` | OG 画像 |
| `robots.txt` | クローラー制御 |
| `sitemap.xml` | サイトマップ |

---

## デフォルト動作と最適化

### 自動生成されるフィールド

メタデータが未定義でも以下は自動生成される。

| フィールド | 役割 |
|---|---|
| `meta charset` | 文字エンコーディングの設定 |
| `meta viewport` | マルチデバイス対応のビューポート設定 |

### ストリーミングメタデータ

動的レンダリングページでメタデータを個別にストリーミングする。

- `generateMetadata` の解決を待たずに UI レンダリングを開始できる
- Twitterbot・Slackbot 等のクローラーに対してはストリーミングが無効化され、全メタデータを含んだ状態で配信される（`htmlLimitedBots` でカスタマイズ可能）

### データリクエストのメモ化

メタデータとページ本体で同じデータを取得する場合、React の `cache` 関数でメモ化することで重複リクエストを回避できる。

---

## 画像メタデータの実装

### 静的 OG 画像

`opengraph-image.png` 等を配置するだけ。フォルダ階層が深いファイルほど優先順位が高い。

### 動的 OG 画像（ImageResponse）

JSX と CSS を使って動的に画像を生成する。内部的に `@vercel/og`、`satori`、`resvg` を使って HTML/CSS → PNG に変換している。

```tsx
// app/posts/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {post.title}
    </div>
  )
}
```

### ImageResponse でサポートされる CSS

```
✅ Flexbox レイアウト
✅ カスタムフォント・テキスト折り返し・中央揃え
✅ 絶対位置指定・ネストされた画像

❌ display: grid 等の高度なレイアウト
```
