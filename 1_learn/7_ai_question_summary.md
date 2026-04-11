# Next.js データフェッチまとめ

## 1. fetch のキャッシュ挙動

- `fetch` 自体はデフォルトでキャッシュなし
- ただし Next.js はページ全体をビルド時に事前レンダリングして HTML 出力をキャッシュする（Static Rendering）
- 動的にしたい（リクエストのたびにサーバーで実行）場合は `{ cache: 'no-store' }` を指定する

```ts
const res = await fetch('https://...', { cache: 'no-store' });
```

### 開発時のログ

`next.config.ts` に以下を追加すると fetch のログが出力される。

```ts
const nextConfig = {
  logging: {
    fetches: { fullUrl: true },
  },
};
```

---

## 2. クライアントコンポーネントでのデータ取得

### SWR / React Query

ユーザー操作で変わるデータや検索・リアルタイム更新に適している。

```ts
'use client'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function BlogPage() {
  const { data, error, isLoading } = useSWR('https://api.example.com/posts', fetcher)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <ul>{data.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

| 変数 | 中身 |
|---|---|
| `data` | fetch 成功時のレスポンスデータ |
| `error` | fetch 失敗時のエラーオブジェクト |
| `isLoading` | データ取得中かどうか |

### `use` フックによるストリーミング

Server Component で fetch してPromiseをそのままClient Componentに渡す。

```tsx
// Server Component
export default function Page() {
  const posts = getPosts() // await しない
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={posts} />
    </Suspense>
  )
}

// Client Component
'use client'
import { use } from 'react'

export default function Posts({ posts }: { posts: Promise<Post[]> }) {
  const allPosts = use(posts)
  return <ul>{allPosts.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

### 使い分け

| パターン | 向いている場面 |
|---|---|
| SWR / React Query | ユーザー操作で変わるデータ、検索、リアルタイム更新 |
| `use` フック | 初期表示データをSEO対応しつつ、表示をブロックしたくない時 |
| 自前 fetch | 1回限りのフェッチ（フォーム送信後、エクスポートなど） |

---

## 3. データ取得の戦略

### 全件取得 vs サーバーサイドフィルタリング

| データの性質 | 向いている方法 |
|---|---|
| 完全に静的（都道府県など） | 定数 or SSG。クライアントフィルタ |
| ほぼ静的だが稀に変わる（カテゴリなど） | ISR やサーバーフィルタ |
| 動的（ホテル・会場など） | サーバーフィルタ一択 |

実務では「全件取得してクライアントでフィルタ」はほぼやらない。通信量・パフォーマンス・セキュリティの観点から最初からサーバーサイドフィルタリングにする。

---

## 4. リクエストの重複排除とキャッシュ

### ① リクエストメモ化（自動）

同一レンダリングパス内で同じ URL の `fetch` が複数呼ばれても実際のリクエストは1回だけ。

```
Page
├── ComponentA → fetch('/api/user')  ┐
├── ComponentB → fetch('/api/user')  ┤ → 実際のリクエストは1回
└── ComponentC → fetch('/api/user')  ┘
```

- スコープ：1リクエスト（1回のレンダリング）限り
- 自動で働くので何もしなくていい

### ② データキャッシュ（`cache: 'force-cache'`）

```ts
fetch('/api/posts', { cache: 'force-cache' })
```

- スコープ：サーバーが動いている間は持続
- Vercel では再デプロイでクリアされる

### ③ React `cache` 関数（fetch を使わない場合）

ORM や DB 直アクセス時に手動でメモ化する。

```ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } })
})
```

これにより各 Server Component が独立して `getUser` を呼んでも、同一リクエスト内なら DB アクセスは1回だけ。

| | スコープ | 用途 |
|---|---|---|
| リクエストメモ化 | 1レンダリング内 | 同じ fetch が複数箇所にある場合の自動最適化 |
| データキャッシュ | リクエストをまたぐ | 更新頻度が低いデータの永続キャッシュ |
| `cache` 関数 | 1レンダリング内 | ORM・DB直アクセス時の手動メモ化 |

---

## 5. Suspense と loading.js

### loading.js

ページ全体をローディング状態にする。page.js全体を `<Suspense>` でラップする。

```tsx
export default function Loading() {
  return <div>Loading...</div>
}
```

**デメリット：** ページ全体が表示されないので LCP が悪化する。

### Suspense

コンポーネント単位でローディング状態を管理する。

```tsx
<>
  <Header />  {/* 即表示 */}
  <Suspense fallback={<div>Loading...</div>}>
    <SlowComponent />  {/* ここだけローディング */}
  </Suspense>
  <Sidebar />  {/* 即表示 */}
</>
```

### 使い分け

| | 向いている場面 |
|---|---|
| `loading.js` | ページ全体のデータが揃わないと意味がない、実装コストを下げたい |
| `Suspense` | 一部だけ遅い、他は先に見せたい、LCP を改善したい |

---

## 6. 順序付きデータ取得

1つのフェッチが別のフェッチの結果に依存する場合（例：都道府県→市区町村）。

```tsx
export default async function Page({ params }) {
  const artist = await getArtist(username) // まずこれが完了する必要がある

  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Playlists artistID={artist.id} />  {/* artist.id がないと呼べない */}
      </Suspense>
    </>
  )
}
```

Suspense を挟むことで「artist.name はすぐ表示して、プレイリストはローディング中として後から差し込む」ができる。

---

## 7. 並行データ取得

### 順序付きフェッチ（遅い）

```ts
const artist = await getArtist(username) // 1秒
const albums = await getAlbums(username) // 2秒
// 合計: 3秒
```

### Promise.all（速い）

```ts
const artistData = getArtist(username)  // await しない
const albumsData = getAlbums(username)  // await しない

const [artist, albums] = await Promise.all([artistData, albumsData])
// 合計: 2秒（長い方に合わせる）
```

### async 関数と Promise の関係

`async` 関数は自動的に Promise を返す。

```ts
async function getArtist(username: string) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json() // → 呼び出し元からは Promise<Artist> が返る
}
```

### エラーハンドリング

| ケース | 方法 |
|---|---|
| 両方揃わないと意味がない | `Promise.all` + 外側で try/catch |
| 片方だけでも表示したい | `Promise.allSettled` |
| 関数単位で個別にエラー処理したい | 各関数内で try/catch |

```ts
// Promise.allSettled
const [artistResult, albumsResult] = await Promise.allSettled([
  getArtist(username),
  getAlbums(username),
])

if (artistResult.status === 'fulfilled') {
  const artist = artistResult.value
}
if (albumsResult.status === 'rejected') {
  console.error(albumsResult.reason)
}
```

### トランザクション

「両方成功か両方失敗か」を保証したい場合は DB のトランザクションで解決する。

```ts
// Prisma の場合
await prisma.$transaction([
  prisma.artist.create({ data: artistData }),
  prisma.album.create({ data: albumData }),
])
// どちらかが失敗したら両方ロールバックされる
```

---

## 8. データの事前読み込み（preload）

条件によってレンダリングされるかわからないコンポーネントのデータを、条件判定より先に取得し始めるパターン。

```ts
export default async function Page({ params }) {
  const { id } = await params

  preload(id)                              // getItem() を裏で即開始
  const isAvailable = await checkIsAvailable() // 並行して実行

  return isAvailable ? <Item id={id} /> : null
}

export const preload = (id: string) => {
  void getItem(id) // void = 意図的に await しないことを明示
}

export const getItem = cache(async (id: string) => {
  // cache でラップしているので実際のフェッチは1回だけ
})
```

`void` は「Promise を返さず捨てる」という意味で、意図的に await しないことを明示するために使う。

`cache` 関数の内部ストアに副作用として保存されるので、`<Item>` 内で `getItem` を呼んだときはキャッシュから返る。

---

## 9. Context の使いどころ

Client Component 間のデータ共有に使う。

| パターン | 例 |
|---|---|
| 認証情報の共有 | ログインユーザーの情報をアプリ全体で使い回す |
| UI 状態の共有 | モーダルの開閉、トースト通知、サイドバーの開閉 |
| テーマ・言語設定 | ダークモード切り替え、多言語対応 |

Server Component + `cache` 関数があれば props のバケツリレーや Context を使わずに各コンポーネントが独立してデータを取得できる（Server Component 限定）。

---

## 10. 無限スクロールと仮想スクロール

### 無限スクロールの問題

- フッターに辿り着けない
- 「どこまで見たか」を見失う
- ブラウザバックで位置が戻らない
- DOM が肥大化してメモリ使用量が増え続ける

### 仮想スクロール（Virtual Scroll）

DOM には「画面に見えている分だけ」レンダリングして、スクロールに応じて中身を入れ替える。React だと `react-window` や `react-virtual` が定番。

### 使い分け

| UI | 向いている手法 |
|---|---|
| SNS フィード | 無限スクロール（終わりを感じさせない意図） |
| EC・検索結果 | ページネーション（何件中何件かが伝わる） |
| BtoB 検索サービス | ページネーション（位置を把握して戻れる） |
