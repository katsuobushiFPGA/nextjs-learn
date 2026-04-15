# Next.js キャッシュ戦略と OGP まとめ

## 1. `react` の `cache`

`react` の `cache` は**リクエスト単位（per-request）のメモ化**。

```ts
import { cache } from 'react'

export const getPost = cache(async (slug: string) => {
  const res = await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
  return res
})
```

- 同一リクエスト内で同じ引数で呼ばれた場合、2回目以降はキャッシュから返す
- リクエスト終了時にキャッシュ破棄
- `fetch` 以外（DB クライアント直叩き等）にも使える

---

## 2. Next.js のキャッシュ手段まとめ

| 手段 | スコープ | 対象 |
|---|---|---|
| `react/cache` | 単一リクエスト | fetch 以外も可 |
| `fetch` Data Cache | 永続 | fetch のみ |
| `unstable_cache` | 永続 | fetch 以外も可 |
| `use cache`（experimental） | 永続 | fetch 以外も可 |

### `unstable_cache` の例

```ts
import { unstable_cache } from 'next/cache'

export const getPost = unstable_cache(
  async (slug: string) => {
    return await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
  },
  ['post'],
  { revalidate: 60, tags: ['post'] }
)
```

### `use cache` の例（Next.js 15 experimental）

```ts
async function getPost(slug: string) {
  'use cache'
  return await db.query.posts.findFirst({ where: eq(posts.slug, slug) })
}
```

### `fetch` のキャッシュ制御

```ts
// 時間ベース
fetch(url, { next: { revalidate: 60 } })

// オンデマンド無効化
revalidateTag('post')
revalidatePath('/posts/[slug]')

// キャッシュしない
fetch(url, { cache: 'no-store' })
```

---

## 3. Redis が必要になるケース

Next.js の Data Cache で大体カバーできるため基本的には不要。ただし以下のケースでは検討する。

| ケース | Redis 必要？ |
|---|---|
| Vercel にデプロイ、単一オリジン | ほぼ不要 |
| セルフホスト、単一インスタンス | 不要なことが多い |
| セルフホスト、マルチインスタンス | ほぼ必要 |
| セッション管理・レート制限が要件 | 必要 |

Vercel の場合は [Remote Cache](https://vercel.com/docs/infrastructure/data-cache) がインスタンス間のキャッシュ共有を解決するため、Redis なしで運用できることが多い。

---

## 4. OGP（Open Graph Protocol）

SNS や Slack で URL を貼ったときのカード表示の仕組み。

```html
<meta property="og:title" content="記事タイトル" />
<meta property="og:description" content="説明文" />
<meta property="og:image" content="https://example.com/og.png" />
<meta property="og:url" content="https://example.com/posts/slug" />
```

### 静的 vs 動的 OG 画像

| | 静的 | 動的 |
|---|---|---|
| 実装 | `public/og.png` を置くだけ | `opengraph-image.tsx` で生成 |
| ページごとの差別化 | なし | あり |
| パフォーマンス | 最大 | やや重い |
| 向いているページ | トップページ・固定ページ | 詳細ページ・記事ページ |

### 動的 OG 画像の実装例

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

### アクセスの流れ

```
クローラーがページにアクセス
  └─ <meta og:image="https://example.com/posts/slug/opengraph-image" /> を発見
       └─ その URL にリクエスト
            └─ Next.js が opengraph-image.tsx を実行
                 └─ DB からデータ取得
                      └─ JSX を 1200x630 の PNG に変換して返す
```

内部的に [Satori](https://github.com/vercel/satori) を使って JSX → SVG → PNG に変換している。

### ImageResponse で使える CSS の注意点

```tsx
// NG
display: 'grid'
gap: '...'

// OK
display: 'flex'
position: 'absolute'
```

### キャッシュとの組み合わせ

`opengraph-image.tsx` 内で呼ぶデータ取得関数は `unstable_cache` でラップしておくと、クローラーが何度アクセスしても DB クエリが走らない。
