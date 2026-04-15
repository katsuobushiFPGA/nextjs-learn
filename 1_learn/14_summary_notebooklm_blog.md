# Next.js 16 SEO・OGP メタデータ管理まとめ

## 1. 宣言的なメタデータ管理

`metadata` オブジェクトをエクスポートするか、`generateMetadata` 関数を定義するだけで `<head>` タグを自動生成してくれる。

- **Server Components のみサポート**（クライアントロジックとの分離）
- タグの閉じ忘れ・重複・設定漏れといったヒューマンエラーを排除

---

## 2. ストリーミングメタデータ

動的ページでのメタデータ取得がボトルネックになる問題をストリーミングで解決。

| 対象 | 挙動 |
|---|---|
| 一般ユーザー | メタデータの解決を待たずに UI を先に表示（知覚パフォーマンス優先） |
| ボット・クローラー | メタデータ解決後に HTML を提供（SEO 正確性優先） |

対象ボットは Twitterbot・Slackbot・Bingbot 等を自動検知。`next.config.js` の `htmlLimitedBots` オプションでカスタマイズ可能。

---

## 3. `react/cache` によるデータメモ化

`generateMetadata` とページ本体で同じデータを取得する場合、`cache` 関数でラップすることで1回のレンダリングサイクル内でデータを共有できる。重複リクエストを防ぎネットワーク効率を最大化する。

```ts
import { cache } from 'react'

export const getPost = cache(async (slug: string) => {
  return await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
})
```

---

## 4. `ImageResponse` による動的 OG 画像生成

Canvas API や外部 SaaS なしに、JSX で動的な OG 画像を生成できる。内部的に `@vercel/og`・`satori`・`resvg` を使って HTML/CSS → PNG に変換している。

```tsx
// app/posts/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return new ImageResponse(
    <div style={{ display: 'flex', fontSize: 128 }}>
      {post.title}
    </div>
  )
}
```

### サポートされる CSS

```
✅ Flexbox、絶対位置指定
✅ カスタムフォント、テキスト折り返し、中央揃え
✅ ネストされた画像

❌ display: grid 等の高度なレイアウト
```

---

## 5. ファイルベースのメタデータと優先順位

ファイルを置くだけでフレームワークが最適なタグを自動生成する。

| ファイル | 用途 |
|---|---|
| `favicon.ico`, `apple-icon.jpg` | ファビコン |
| `opengraph-image.jpg`, `twitter-image.jpg` | OG 画像 |
| `robots.txt` | クローラー制御 |
| `sitemap.xml` | サイトマップ |

**優先順位のルール：** フォルダ階層が深い（より具体的なルート）ファイルが上位階層の設定を上書きする。
