# Next.js 16 データ取得とストリーミング：技術概要

## 1. コンポーネントに応じたデータ取得手法

### Server Components

サーバー上で実行されるため、安全かつ効率的にデータにアクセスできる。

- **fetch API**：コンポーネントを `async` 関数にして `await` で取得。デフォルトでは出力がキャッシュされる。動的レンダリングが必要な場合は `{ cache: 'no-store' }` を指定する。
- **ORM / データベース**：サーバー上で直接実行されるため、ORM やデータベースクライアントを安全に使用できる。

### Client Components

- **React `use` フック**：Server Component から渡された Promise を読み取る。サーバーからクライアントへのストリーミングが可能。
- **SWR / React Query**：独自のキャッシング・ストリーミング・リトライのセマンティクスを提供するコミュニティライブラリ。

---

## 2. リクエストの最適化：重複排除とキャッシング

### リクエストメモ化（自動）

単一のレンダリングパス内で、同じ URL・オプションの `GET` / `HEAD` リクエストを自動的に1つに統合する。スコープは1リクエストのライフタイム限り。

### データキャッシュ

```ts
fetch('/api/data', { cache: 'force-cache' })
```

後続のリクエスト間でもデータを共有できる。ORM や DB を直接使う場合は React の `cache` 関数でラップすることで同様の効果を得られる。

```ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } })
})
```

---

## 3. ストリーミングとユーザーエクスペリエンス

| 手法 | 適用範囲 | 特徴 |
|---|---|---|
| `loading.js` | ルートセグメント全体 | 自動的に `<Suspense>` を配置し、ページ全体のロード状態を表示 |
| `<Suspense>` | コンポーネント単位 | 特定のパーツを個別にストリーミングし、より細かな制御が可能 |

ローディング中のフォールバック UI（スケルトン、スピナー、画面の一部など）を適切に設計することで、アプリの応答性をユーザーに伝えることが推奨される。

---

## 4. 高度なデータ取得パターン

### 順序付きデータ取得（Sequential）

1つのフェッチが別の結果に依存する場合に使用する。

```tsx
const artist = await getArtist(username)  // まず取得

return (
  <Suspense fallback={<div>Loading...</div>}>
    <Playlists artistID={artist.id} />  {/* artist.id が確定してから開始 */}
  </Suspense>
)
```

`<Suspense>` と組み合わせることで、ルート全体がブロックされるのを防ぐ。

### 並行データ取得（Parallel）

複数のリクエストを同時に開始し、待機時間を短縮する。

```ts
const artistData = getArtist(username)  // await しない
const albumsData = getAlbums(username)  // await しない

const [artist, albums] = await Promise.all([artistData, albumsData])
// 合計待機時間 = 最も遅いリクエストの時間
```

1つが失敗すると全体が失敗する場合は `Promise.allSettled` を使う。

```ts
const [artistResult, albumsResult] = await Promise.allSettled([
  getArtist(username),
  getAlbums(username),
])
```

### データの事前読み込み（Preloading）

条件判定やブロッキングリクエストより先にデータ取得を開始する最適化手法。

```ts
export const preload = (id: string) => {
  void getItem(id)  // void = 意図的に await しないことを明示
}

export const getItem = cache(async (id: string) => {
  // cache でラップ → 実際のフェッチは1回だけ
})

// 使用例
preload(id)                              // 裏で即開始
const isAvailable = await checkIsAvailable()  // 並行して実行
return isAvailable ? <Item id={id} /> : null
```

`server-only` パッケージを使うことで、データ取得関数をサーバー上でのみ実行されるように制限できる。

---

## 5. 補足・制限事項

- **Next.js 15/16 の互換性**：一部のストリーミング機能（`cacheComponents` 設定など）は Next.js 15 canary 以降での導入を前提とする場合がある。
- **セキュリティ**：組み込みのデータセキュリティ機能（タイント化など）でデータ保護を支援する。
- **デバッグ**：開発環境では `logging` API を使用して `fetch` 呼び出しをログ出力し、データの流れを可視化できる。
