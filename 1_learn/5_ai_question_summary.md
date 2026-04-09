# Next.js Server Components / Client Components まとめ

## 1. 基本的な分類

### クライアントコンポーネントにしなければならない条件

以下のいずれかを使う場合は `'use client'` が必要。

| 使うもの | 例 |
|---|---|
| ブラウザのイベントハンドラ | `onClick`, `onChange` など |
| React の状態・ライフサイクル | `useState`, `useEffect`, `useReducer` |
| ブラウザ専用 API | `localStorage`, `window`, `navigator` |
| サードパーティのクライアント系ライブラリ | アニメーション、チャートなど |

**これらを一切使わないなら、デフォルトのサーバーコンポーネントのままでよい。**

---

## 2. `'use client'` の境界

`'use client'` はファイル（モジュール）単位で機能する。同一ファイル内にサーバーコンポーネントとクライアントコンポーネントを混在させることはできない。

### 境界は末端に押し込む

```
// NG: 上位に 'use client' を置くと子孫が全部クライアントになる
Page（'use client'）
├── Header       ← 不要なのにクライアントになる
├── ArticleBody  ← 不要なのにクライアントになる
└── LikeButton   ← これだけでよかった

// OK: 末端だけクライアント
Page（Server）
├── Header（Server）
├── ArticleBody（Server）
└── LikeButton（Client）  ← 'use client' はここだけ
```

### `'use client'` を付けるファイルの判断基準

「Server Component から直接レンダリングしたいコンポーネント」＝クライアント境界の起点になるコンポーネントにだけ付ける。

```
Page（Server）
├── Header（Server）        ← 'use client' 不要
└── LikeButton（Client）    ← 'use client' 必要（境界の起点）
    └── Icon（Client）      ← 'use client' 不要（LikeButton の子なので自動で Client 扱い）
```

### 子コンポーネントへの明示的な付与

- 親が `'use client'` を宣言していれば子への記述は**不要**（冗長になる）
- ただし**単独でも再利用される汎用コンポーネント**（UIライブラリなど）は明示した方が安全

---

## 3. RSC Payload

サーバーからクライアントへの橋渡しとなるバイナリ形式のデータ。

### 含まれるもの

- Server Component のレンダリング結果
- Client Component をレンダリングする場所のプレースホルダーと JS ファイルへの参照
- Server Component から Client Component に渡される props

### 流れ

```
サーバー側
  Post コンポーネントをレンダリング
  ↓
RSC Payload に { likes: 42 } を含めて送信
  ↓
クライアント側
  Payload を受け取り LikeButton に { likes: 42 } を注入してレンダリング
```

Client Component の JS は RSC Payload とは**別に**ダウンロードされる。RSC Payload 内の「参照」を元にクライアントが取りに行くイメージ。

---

## 4. Server → Client へのデータの渡し方

### props で渡す

```tsx
// Server Component
const post = await getPost(id)
return <LikeButton likes={post.likes} />
```

- データ取得完了後に送信
- シリアライズできる値のみ渡せる（関数・クラスインスタンスは不可）
- シンプルで基本的な方法

### `use` フックでストリーミングする

```tsx
// Server Component
const dataPromise = getPost(id)  // await しない
return <LikeButton dataPromise={dataPromise} />

// Client Component
'use client'
import { use } from 'react'

export default function LikeButton({ dataPromise }: { dataPromise: Promise<Post> }) {
  const post = use(dataPromise)  // Suspense で待機
}
```

- 骨格を先に表示してからデータを流し込む
- Suspense が必要
- 初期表示を速く見せたい時に使う

Promise の実行・解決はサーバー側で起き、解決済みのデータがストリームでクライアントに届く。

---

## 5. HTTP/2 ストリーミング

Next.js のストリーミングは HTTP/2 の仕組みを使う。

```
クライアント          サーバー
    |                   |
    |── GET /page ──→   |  リクエスト（1回）
    |                   |
    |← DATA frame ①    |  HTML骨格 + Suspense fallback（即座に表示）
    |← DATA frame ②    |  RSC Payload（データ解決後）
    |← DATA frame ③    |  Client Component JS 参照
    |                   |
    |       END_STREAM  |
    |                   |
    TCP 接続は維持（他リクエストで多重利用可能）
```

- 接続は張りっぱなしで、サーバーが全部送り終わるまで続く
- HTTP/1.1 の `Transfer-Encoding: chunked` と構造は同じ
- HTTP/2 では 1 本の TCP 接続上で複数ストリームを多重化できるため、CSS・JS 取得と並行してページストリームを受信できる

---

## 6. Server / Client のインターリーブ（`children` パターン）

Client Component の中に Server Component を視覚的にネストできる。

```tsx
// modal.tsx（Client Component）
'use client'
export default function Modal({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// page.tsx（Server Component）
import Modal from './ui/modal'
import Cart from './ui/cart'

export default function Page() {
  return (
    <Modal>
      <Cart />  {/* Server Component */}
    </Modal>
  )
}
```

### なぜ成立するか

`children` も結局は props の一つ。`Cart` のレンダリングは `Page`（Server）が責任を持ち、その結果が RSC Payload に含まれて `Modal` の `children` としてはめ込まれる。

```
1. サーバー側で Cart をレンダリング（DB アクセスなど）
2. その結果を RSC Payload に含める
3. クライアント側で Modal をレンダリング
4. children（Cart のレンダリング済み結果）をはめ込む
```

**注意:** Client Component の内側から Server Component を直接 import することはできない。`children` として渡す場合は親（Server）がレンダリングしているので問題ない。

### メリット

`Modal` の open/close 状態（`useState`）はクライアントで管理しつつ、中身の `Cart` はサーバーでデータフェッチできる。

---

## 7. サードパーティライブラリの対応

`'use client'` が書かれていないサードパーティコンポーネントをサーバーコンポーネントから直接 import するとエラーになる。

### 対応策：ラッパーファイルを作る

```tsx
// app/carousel.tsx
'use client'
import { Carousel } from 'acme-carousel'
export default Carousel  // 再エクスポートするだけ
```

```tsx
// app/page.tsx（Server Component）
import Carousel from './carousel'  // ラッパーから import

export default function Page() {
  return <Carousel />  // OK
}
```

---

## 8. サーバー専用モジュールの保護

### 環境変数のルール

```ts
process.env.API_KEY          // クライアントでは "" に置き換えられる（漏れない）
process.env.NEXT_PUBLIC_KEY  // クライアントバンドルに含まれる（意図的に公開）
```

### `server-only` パッケージ

DB アクセスや秘密の API キーを使うユーティリティ関数はクライアントから誤って import された時にビルドエラーにする。

```ts
import 'server-only'  // クライアントから import されたらビルドエラー

export async function getData() {
  const res = await fetch('https://api.example.com', {
    headers: { authorization: process.env.API_KEY },
  })
  return res.json()
}
```

**`server-only` が必要なもの:** `lib/data.ts` のようなユーティリティ関数（コンポーネントではないので Next.js が自動で守ってくれない）

**`server-only` が不要なもの:** サーバーコンポーネント（コンポーネントなので Next.js が境界を守ってくれる）

---

## 9. ディレクティブ・パッケージまとめ

| ディレクティブ / パッケージ | 用途 |
|---|---|
| `'use client'` | クライアント境界の宣言（React の機能） |
| `'use server'` | Server Actions の宣言 |
| `server-only` | サーバー専用モジュールの保護 |

### Server Actions（`'use server'`）

クライアントからサーバー側の処理を呼び出す仕組み。内部的には API エンドポイントが自動生成される。

```ts
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  await db.post.create({ data: { title } })
}
```

```tsx
// Client Component から呼び出す
'use client'
import { createPost } from '@/app/actions'

export default function Page() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">投稿</button>
    </form>
  )
}
```

---

## 10. Provider の配置

Provider は「そのContextを使うコンポーネントが存在する範囲だけ」を囲む。

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>       {/* Server Component のまま */}
      <body>     {/* Server Component のまま */}
        <ThemeProvider>   {/* ← ここからクライアント境界 */}
          {children}      {/* これだけをラップ */}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`<html>` や `<body>` ごとラップすると不要なものまでクライアントバンドルに引き込まれるので注意。

