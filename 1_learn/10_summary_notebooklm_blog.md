# Next.js 16 エラーハンドリングの新常識

## エラーの2分類

| 種類 | 概要 | 扱い方 |
|---|---|---|
| 予期されたエラー | バリデーション失敗、権限不足など。正常フローの一部 | **データ**として戻り値で返す |
| 未処理の例外 | バグ、ネットワーク切断など。本来起きてはいけないもの | エラーバウンダリーで封じ込める |

---

## 新常識1: throw せず戻り値でモデル化する（Server Functions）

予期されたエラーは `try/catch` でスローせず、`useActionState` と組み合わせて戻り値で返す。

```ts
// actions.ts
'use server'
export async function createPost(prevState: any, formData: FormData) {
  const res = await fetch('https://api.vercel.app/posts', {
    method: 'POST',
    body: JSON.stringify({ title: formData.get('title') }),
  })
  if (!res.ok) {
    return { message: 'Failed to create post' } // throwしない
  }
}
```

Server Components の場合は条件付きレンダリングで対処。

```tsx
// page.tsx
export default async function Page() {
  const res = await fetch(`https://...`)
  if (!res.ok) return 'There was an error.'
  return '...'
}
```

---

## 新常識2: `error.tsx` による局所的な封じ込めと回復

- セグメントごとに配置することで影響範囲を限定できる（例：コンテンツエリアだけクラッシュ、サイドバーは生存）
- **同じセグメントの `layout.tsx` で起きたエラーはキャッチできない**（バウンダリーは「子」を包む性質のため）
- `reset()` で再レンダリングを試みられる

```tsx
// app/dashboard/error.tsx
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

---

## 新常識3: `startTransition` でイベントハンドラーの盲点を突破

**エラーバウンダリーはイベントハンドラー（`onClick` など）内のエラーを検知しない**。レンダリング外で実行されるため。

通常の回避策は `useState` で手動管理だが、`startTransition` 内でスローされたエラーは自動的に最寄りの `error.tsx` までバブルアップする。

```tsx
'use client'
import { useTransition } from 'react'

export function Button() {
  const [pending, startTransition] = useTransition()

  const handleClick = () =>
    startTransition(() => {
      throw new Error('Exception') // 親の error.tsx がキャッチする
    })

  return <button onClick={handleClick}>Click me</button>
}
```

---

## 新常識4: `global-error.tsx` と `notFound()`

### `global-error.tsx`

ルートレイアウト（`app/layout.tsx`）のエラーは通常の `error.tsx` では処理できない。`global-error.tsx` が「最後の砦」になる。アプリ全体を置き換えるため **`<html>` と `<body>` の定義が必要**。

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

### `notFound()`

リソースが存在しないと判明した時点で即座に呼び出す。`not-found.tsx` の 404 専用UIが表示される。

```tsx
if (!post) notFound()
```

---

## まとめ

| 状況 | 対処 |
|---|---|
| バリデーション失敗・APIエラー | 戻り値で返す（`useActionState`） |
| Server Component のデータ取得失敗 | 条件付きレンダリング |
| リソースが存在しない | `notFound()` |
| バグ・想定外の例外 | `error.tsx`（エラーバウンダリー） |
| イベントハンドラー内の例外 | `startTransition` 内でスロー or `useState` で手動管理 |
| ルートレイアウトのクラッシュ | `global-error.tsx` |
