i# Next.js App Router エラーハンドリングまとめ

## Server Action の基本的なバグ

```ts
// ❌ NG
const res = await fetch('https://api.vercel.app/posts', {
  method: 'POST',
  body: { title, content }, // オブジェクトをそのまま渡すと "[object Object]" になる
})
```

```ts
// ✅ OK
const res = await fetch('https://api.vercel.app/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ title, content }),
})
```

---

## API エンドポイントの切り替え

### ローカルサーバ

`.env.local` に書いて環境変数で管理する。Server Action 内なので `NEXT_PUBLIC_` 不要。

```env
API_BASE_URL=http://localhost:8000
```

```ts
const res = await fetch(`${process.env.API_BASE_URL}/posts`, { ... })
```

### 外部モックAPI（開発用）

[JSONPlaceholder](https://jsonplaceholder.typicode.com/) が定番。実際にはデータは保存されないがレスポンスは返ってくる。

```ts
const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, content }),
})
```

---

## エラーハンドリング（App Router）

エラーは2種類に分類される。

### 1. 予期されたエラー（Expected Errors）

バリデーション失敗・APIエラーなど起きうることが分かっているエラー。`throw` せず **戻り値として返す** のが原則。

#### Server Functions（Server Actions）

`useActionState` と組み合わせて使う。

```ts
// actions.ts
'use server'
export async function createPost(prevState: any, formData: FormData) {
  const res = await fetch(...)
  if (!res.ok) {
    return { message: 'Failed to create post' } // throwしない
  }
}
```

```tsx
// form.tsx（Client Component）
'use client'
const [state, formAction, pending] = useActionState(createPost, initialState)
// state.message でエラーを表示
```

#### Server Components

fetch のレスポンスを見て条件分岐するだけ。

```tsx
if (!res.ok) return 'There was an error.'
```

#### 404

`notFound()` を呼ぶと同セグメントの `not-found.tsx` が表示される。

```tsx
if (!post) notFound()
```

---

### 2. 未処理の例外（Unhandled Exceptions）

バグなど本来起きてはいけないエラー。エラーバウンダリーで処理する。

#### `error.tsx`

ルートセグメントごとに置けるエラーバウンダリー。Client Component である必要がある。

```tsx
'use client'
export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**注意点：**
- イベントハンドラー内のエラーはキャッチされない → `useState` で手動管理
- `startTransition` 内の未処理エラーは最寄りのバウンダリーまでバブルアップする

#### `global-error.tsx`

ルートレイアウト自体のエラーに対応。レイアウトを完全に置き換えるため `<html>` と `<body>` の定義が必要。

```tsx
'use client'
export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

---

## エラーバウンダリーのバブルアップ

DOMのイベントバブリングと同様に、エラーが発生したコンポーネントからツリーを上に向かって最も近い `error.tsx` まで伝搬する。

```
app/
├── error.tsx              ← ③ ここでキャッチ
└── dashboard/
    └── settings/
        └── page.tsx       ← ① ここでエラー発生
                              ② dashboard/に error.tsx がないので上へバブルアップ
```

`dashboard/` に `error.tsx` があればそこで止まる。なければさらに上へ伝搬する。

イベントバブリングとの違いは `stopPropagation()` 相当がなく、最初に見つかったバウンダリーで必ずキャッチされて止まる点。

セグメントごとに粒度を調整できるのが App Router の旨みで、`/dashboard` 配下だけクラッシュさせてヘッダーやサイドバーは生かしたまま、といった設計が自然に書ける。

---

## まとめ

| 状況 | 種類 | 対処 |
|---|---|---|
| フォームバリデーション失敗、APIエラー | 予期されたエラー | 戻り値で返す（`useActionState`） |
| リソースが見つからない | 予期されたエラー | `notFound()` |
| バグ・想定外の例外 | 未処理の例外 | `error.tsx` |
| ルートレイアウトのクラッシュ | 未処理の例外 | `global-error.tsx` |
