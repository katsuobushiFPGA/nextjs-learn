# Next.js Server Actions まとめ

## 1. Server Components は純関数でなくていい

Client Components は再レンダリングや Concurrent Mode での中断・再実行があるため純粋性が必要。  
一方 Server Components は**1リクエストにつき1回だけ実行され再レンダリングしない**ため、DB アクセスや fetch などの副作用が普通に書ける。

```tsx
export default async function HotelList() {
  const hotels = await db.query('SELECT * FROM hotels') // 副作用だが問題なし
  return <ul>{hotels.map(h => <li key={h.id}>{h.name}</li>)}</ul>
}
```

ただし避けるべきことはある：
- グローバル変数の書き換え（リクエスト間で状態が混入）
- `cookies()` / `headers()` の結果を module スコープにキャッシュ

---

## 2. Server Actions のインライン定義

Server Components 内に `'use server'` をインライン定義できる。

```tsx
export default function Page({ userId }: { userId: string }) {
  async function createPost(formData: FormData) {
    'use server'
    await db.insert({ userId, content: formData.get('content') })
  }
  return <form action={createPost}>...</form>
}
```

**インラインのメリット：** Server Component のスコープにある変数（props 等）を直接クロージャで捕捉できる。  
別ファイルだと hidden field や引数の追加が必要になる。

| | インライン | 別ファイル |
|---|---|---|
| スコープの変数を閉じ込める | ✅ | ❌ |
| 再利用 | ❌ | ✅ |
| テストしやすさ | ❌ | ✅ |

---

## 3. `<form action={}>` の実態

HTML ネイティブの `action` は文字列（URL）のみだが、React 19 では関数を渡せる。

**ビルド時に変換される：**
- 関数本体はサーバー側にとどまる
- クライアントには参照（ACTION_ID）だけ渡る
- クロージャで捕捉した値は `bound` としてシリアライズ・復元される

実際のHTML出力例：
```html
<button
  name="$ACTION_ID_00d4a3f912053d3da37e7c47002a3e73b2fbd12ffe"
  formaction=""
  formenctype="multipart/form-data"
  formmethod="POST"
>
```

**フォーム送信の流れ：**
- JS あり → React が fetch に変換して内部エンドポイントに POST
- JS なし → ブラウザネイティブの form POST として動く（Progressive Enhancement）

---

## 4. Progressive Enhancement

「JS が無効でも基本機能が動く」設計思想。

`<form action={}>` は JS なしでもブラウザのネイティブ form 送信として機能する。  
`onClick` などのイベントハンドラーは JS がないと動かないため PE できない。

---

## 5. セキュリティ・権限チェック

ACTION_ID を改ざんしても呼べるのは登録済みの Action のみ。  
**本質的なリスクは認証・認可の漏れ。** Server Action = 公開エンドポイントとして扱う。

```ts
async function deletePost(formData: FormData) {
  'use server'
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const post = await db.findPost(formData.get('postId'))
  if (post.userId !== session.userId) throw new Error('Forbidden')

  await db.delete({ id: post.id })
}
```

### Next.js 公式推奨パターン：Middleware + DAL の二段構え

**Middleware（ルートレベル）：**
```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  if (!session) return NextResponse.redirect(new URL('/login', request.url))
}
```

**DAL（Data Access Layer）：**
```ts
// lib/dal.ts
export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})

// lib/posts.ts
export async function getPost(postId: string) {
  const session = await verifySession() // 認証
  const post = await db.findPost(postId)
  if (post.userId !== session.userId) throw new Error('Forbidden') // 認可
  return post
}
```

| 場所 | 役割 |
|---|---|
| Middleware | 未認証ユーザーをルートレベルで弾く |
| DAL (`verifySession`) | 認証セッションの検証を一元化 |
| DAL の各関数 | リソースへのアクセス権（認可）チェック |

---

## 6. Server Functions の呼び出し方

### フォームから（Server Component）
```tsx
export default function Page() {
  async function createPost(formData: FormData) {
    'use server'
    await db.insert({ content: formData.get('content') })
    revalidatePath('/posts')
  }
  return (
    <form action={createPost}>
      <input name="content" />
      <button type="submit">投稿</button>
    </form>
  )
}
```
Progressive Enhancement が効く。JS なしでも動く。

### フォームから（Client Component）
```tsx
'use client'
import { createPost } from './actions' // 別ファイルから import が必要

export function PostForm() {
  return (
    <form action={createPost}>
      <input name="content" />
      <button type="submit">投稿</button>
    </form>
  )
}
```
Client Component では `'use server'` をインラインに書けないため、必ず別ファイルからインポートする。

> **ポイント：** ただフォームを表示して送信するだけなら Server Component で十分。  
> Client Component にするのは `useState` などクライアント側の状態が必要なとき。

### useFormStatus でローディング状態
```tsx
'use client'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? '送信中...' : '投稿'}</button>
}
```

### イベントハンドラーから（useTransition）
```tsx
'use client'
import { useTransition } from 'react'

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => deletePost(postId))}
      disabled={isPending}
    >
      {isPending ? '削除中...' : '削除'}
    </button>
  )
}
```

### useEffect から
```tsx
'use client'
export function PageTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    logPageView(pageId)
  }, [pageId])
  return null
}
```

### 呼び出し方の使い分け

| 呼び出し方 | 向いてるケース | Progressive Enhancement |
|---|---|---|
| `<form action={}>` (Server Component) | 投稿・更新フォーム | ✅ |
| `<form action={}>` (Client Component) | 状態と連動するフォーム | ✅ |
| イベントハンドラー + `useTransition` | 削除ボタン・いいねなど | ❌ |
| `useEffect` | ロギング・分析 | ❌ |

---

## 7. Server Actions vs Route Handler vs Server Components

| パターン | 使いどころ |
|---|---|
| Server Components でデータ取得 | ページ初期表示のデータ取得 |
| Server Actions | ミューテーション全般（自アプリ内） |
| Route Handler | GET API、外部 Webhook、カスタムレスポンス、REST API |
| Client から直接 fetch | App Router ではほぼ不要 |

**Server Actions は REST と相性が悪い。** POST 固定・URL なしのため、外部公開 API は Route Handler で作る。

---

## 8. バリデーションの共通化（zod）

クライアントとサーバーで同じバリデーションロジックを書かずに済む。

```ts
// lib/schemas/post.ts
import { z } from 'zod'

export const postSchema = z.object({
  content: z.string().min(1).max(140),
})
```

```ts
// Server Actions 側
const result = postSchema.safeParse({ content: formData.get('content') })
if (!result.success) return { error: result.error.flatten().fieldErrors }
```

```tsx
// Client Component 側（react-hook-form + zod）
const { register, handleSubmit, formState: { errors } } = useForm<PostInput>({
  resolver: zodResolver(postSchema), // 同じスキーマを渡すだけ
})
```

**zod でできる複雑なバリデーション：**
- `refine` で相関バリデーション（チェックイン/アウトの前後関係など）
- `superRefine` で条件付きバリデーション
- `superRefine` の非同期版（メールアドレス重複チェックなど）→ **サーバー側のみ**

---

## 9. Server Components のログ・デバッグ

```tsx
export default async function Page() {
  console.log('ここに出る') // → npm run dev を叩いたターミナルに出力
}
```

本番向けには pino が定番：
```ts
// lib/logger.ts
import pino from 'pino'
export const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })
```

**ステップデバッグ：** `.vscode/launch.json` を用意して VSCode の Run & Debug（F5）で起動。  
Neovim でも nvim-dap で可能だが設定コストあり。「普段 Neovim、デバッグ時だけ VSCode」が現実的。

---

## 10. キャッシュ再検証

```ts
import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  'use server'
  await db.insert(...)
  revalidatePath('/posts')   // パスで指定
  // または
  revalidateTag('posts')     // タグで一括クリア
}
```

| | 方法 | 向いてるケース |
|---|---|---|
| `revalidate: 60` | 時間ベース | 更新頻度が予測できるデータ |
| `revalidatePath` | パスで指定 | 特定ページを即時クリア |
| `revalidateTag` | タグで指定 | 複数ページにまたがるデータの即時クリア |

---

## 11. リダイレクト

```ts
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  'use server'
  await db.insert(...)
  revalidatePath('/posts')
  redirect('/posts') // ← 例外をスローして処理を中断
  // 以降のコードは実行されない
}
```

`redirect` は内部的に例外をスローする。`try/catch` で囲むと捕まってしまうので注意：

```ts
// OK
try {
  await db.insert(...)
} catch (e) {
  console.error(e)
}
revalidatePath('/posts')
redirect('/posts') // try の外に出す
```

---

## 12. Server Actions の本質

Server Actions は実質 **RPC（Remote Procedure Call）**。

```
従来の REST:    フロントエンド → HTTP → バックエンド → DB
Server Actions: フロントエンド → Server Action → DB
```

HTTP の層が隠蔽され、バックエンドの処理を関数呼び出しとして書ける。  
tRPC のようなスキーマ定義・クライアント生成も不要。

---

## 13. startTransition と UI 更新の優先度

```tsx
const [isPending, startTransition] = useTransition()

useEffect(() => {
  startTransition(async () => {
    const updatedViews = await incrementViews()
    setViews(updatedViews) // 「急がなくていい更新」として処理
  })
}, [])
```

**優先度の順序（高い順）：**
1. ユーザー入力（onClick、onChange など）
2. 通常の setState
3. `startTransition` で包んだ更新

同一イベントハンドラー内の複数 setState は**自動バッチ処理**で1回のレンダリングにまとめられる（React 18以降）。
