# Next.js 16 データ取得の新常識：5つのポイント

## 1. Server Components によるデータベース直結

これまでのようにフロントエンドから呼び出す API Route をわざわざ定義する必要がなくなった。コンポーネント自体を `async function` として定義し、直接 `await` で ORM やデータベースクライアントを呼び出せる。

```ts
export default async function Page() {
  const data = await db.user.findMany() // API Route 不要
  return <div>{data.name}</div>
}
```

**ポイント：** サーバー上で実行されるため、秘匿性の高いクエリやデータベース接続を安全に行える。クライアント側にロジックや機密情報が露出しない。

---

## 2. 自動化されたリクエストメモ化

単一のレンダリングパス内で、同じ URL・オプションを持つ `fetch` 呼び出しは自動的に1つに統合される。

```
Page
├── ComponentA → fetch('/api/user')  ┐
├── ComponentB → fetch('/api/user')  ┤ → 実際のリクエストは1回
└── ComponentC → fetch('/api/user')  ┘
```

**注意点：**
- 適用されるのは `GET` / `HEAD` メソッドのみ
- Abort シグナルを渡すことでオプトアウト可能
- スコープは1リクエストのライフタイム限り

---

## 3. `use` フックによるデータの架け橋

Client Components へのデータ取得の起点は Server Component に置くのが新常識。Server Component で取得を開始した Promise を props として渡し、`use` フックで読み取る。

```tsx
// Server Component
export default function Page() {
  const posts = getPosts() // await しない → Promise のまま渡す
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
  const allPosts = use(posts) // ここで解決
  return <ul>{allPosts.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

**ポイント：** サーバー側で即座にデータ取得を開始しつつ、クライアント側でその結果を待つという役割分担が実現する。

---

## 4. ストリーミングと loading.js の使い分け

ページの HTML を小さなチャンクに分割し、準備ができた部分から段階的にクライアントへ送信する。

| 手法 | 適用範囲 | 特徴 |
|---|---|---|
| `loading.js` | ページ全体 | 自動的に `<Suspense>` を配置。実装が簡単 |
| `<Suspense>` | コンポーネント単位 | 細かく制御可能。LCP の改善に有効 |

**意味のあるロード状態の設計：** 単なるスピナーではなく、スケルトン UI や将来表示される画面の一部（カバー画像・タイトルなど）を先に表示することで体感速度が向上する。

---

## 5. 並行データ取得と Preload によるボトルネック解消

### Promise.all による並行取得

```ts
// ❌ 順次実行（ウォーターフォール）
const artist = await getArtist(username) // 1秒
const albums = await getAlbums(username) // 2秒 → 合計 3秒

// ✅ 並行実行
const artistData = getArtist(username)
const albumsData = getAlbums(username)
const [artist, albums] = await Promise.all([artistData, albumsData])
// → 合計 2秒（最も遅いリクエストの時間）
```

1つの失敗が全体に波及するのを防ぎたい場合は `Promise.allSettled` を使う。

### preload パターン

条件付きレンダリングでコンポーネントが呼び出される前に、積極的にデータ取得を開始しておく。

```ts
export const preload = (id: string) => {
  void getItem(id) // 裏で即開始
}

export const getItem = cache(async (id: string) => {
  // cache でラップ → 実際のフェッチは1回だけ
})

// 使用例
preload(id)                                  // データ取得を先に開始
const isAvailable = await checkIsAvailable() // 並行して実行
return isAvailable ? <Item id={id} /> : null // レンダリング時にはデータ準備済み
```

---

## まとめ

| ポイント | 従来 | Next.js 16 |
|---|---|---|
| データ取得 | API Route 経由 | Server Component で直結 |
| 重複リクエスト | 手動で制御 | 自動メモ化 |
| Client へのデータ渡し | props のバケツリレー | `use` フック + Promise |
| ローディング管理 | 命令的に記述 | `Suspense` で宣言的に定義 |
| 並行取得 | 個別に管理 | `Promise.all` / `preload` |
