# Next.js エラーハンドリング：体系的アプローチ

## エラーの2分類

| カテゴリ | 例 | 処理手法 |
|---|---|---|
| 予期されたエラー | フォームバリデーション失敗、APIリクエスト失敗 | 戻り値でモデル化、`useActionState`、`redirect` |
| 未処理の例外 | バグ、レンダリング中のエラー | `error.tsx`、`global-error.tsx` |

---

## 予期されたエラーの処理

### Server Functions

`throw` せず、エラー情報をオブジェクトとして返す。`useActionState` でUIに反映。

```ts
// actions.ts
'use server'
export async function createPost(prevState: any, formData: FormData) {
  const res = await fetch('...')
  if (!res.ok) {
    return { message: 'Failed to create post' }
  }
}
```

```tsx
// form.tsx
'use client'
const [state, formAction, pending] = useActionState(createPost, initialState)
// state.message でエラー表示（aria-live="polite" でアクセシブルに）
```

### Server Components

fetch のレスポンスを見て条件付きレンダリング or `redirect()`。

```tsx
if (!res.ok) return 'There was an error.'
```

### 404

`notFound()` を呼ぶと同セグメントの `not-found.tsx` が表示される。

```tsx
if (!post) notFound()
```

---

## 未処理の例外の処理

### `error.tsx`（エラーバウンダリー）

- **必ず Client Component**（`'use client'`）
- `reset()` でセグメントの再レンダリングを試みられる
- `useEffect` でエラーを外部サービスへ報告するのが一般的

```tsx
'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### ネストされたエラーバウンダリー

エラーは最も近い親の `error.tsx` までバブルアップする。セグメントごとに配置することで影響範囲を局所化できる。

### エラーバウンダリーの限界と対策

| ケース | 動作 | 対策 |
|---|---|---|
| イベントハンドラー・非同期コード内 | バウンダリーでキャッチされない | `try/catch` + `useState` で手動管理 |
| `startTransition` 内 | 最寄りのバウンダリーまでバブルアップする | そのまま `throw` でOK |

---

## グローバルエラー（`global-error.tsx`）

ルートレイアウトで起きたエラーに対応。アプリ全体を置き換えるため **`<html>` と `<body>` の定義が必要**。

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

## まとめ

| 状況 | 対処 |
|---|---|
| バリデーション失敗・APIエラー | 戻り値で返す（`useActionState`） |
| Server Component のデータ取得失敗 | 条件付きレンダリング or `redirect()` |
| リソースが存在しない | `notFound()` → `not-found.tsx` |
| バグ・想定外の例外 | `error.tsx` |
| イベントハンドラー内の例外 | `useState` で手動管理 |
| `startTransition` 内の例外 | 最寄りの `error.tsx` へバブルアップ |
| ルートレイアウトのクラッシュ | `global-error.tsx` |
