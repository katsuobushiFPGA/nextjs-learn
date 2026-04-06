# Next.js App Router：レイアウトとページの構築

## エグゼクティブサマリー

Next.js はフォルダーとファイルでルートを定義する**ファイルシステムベースのルーティング**を採用している。  
主要な構成要素は「ページ」と「レイアウト」であり、以下の特性を持つ。

- **ページ**：特定のルート固有のUIを提供
- **レイアウト**：複数のページ間で共有されるUIを管理。ナビゲーション時も状態を保持し、再レンダリングされない

---

## 1. ルーティングの基本原則

| 構成要素 | 役割 |
|---|---|
| フォルダー | URLセグメントに対応するルートセグメントを定義 |
| ファイル | `page.js` や `layout.js` で各セグメントのUIを作成 |

### ルート構造のイメージ

```
/              ← ルートセグメント
└── blog       ← セグメント
      └── [slug]  ← リーフセグメント（URLの末尾）
```

---

## 2. ページとレイアウト

### ページ（Pages）

特定のルートにアクセスした際にレンダリングされる固有のUI。

```tsx
// app/page.tsx → / としてアクセス可能
export default function Page() {
  return <h1>Hello Next.js!</h1>
}
```

- `app` ディレクトリ内に `page.tsx` を追加し、Reactコンポーネントをデフォルトエクスポートすることで定義する

### レイアウト（Layouts）

複数のページ間で共有されるUI。

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

| 特性 | 説明 |
|---|---|
| 状態の保持 | ナビゲーション時も state が維持される |
| 再レンダリングなし | ページ遷移時にレイアウト自体は再レンダリングされない |
| `children` 必須 | 子コンポーネント（ページや別のレイアウト）を受け取る |
| ルートレイアウト | `<html>` と `<body>` タグを含むことが必須 |

---

## 3. 高度なルーティング機能

### ネストされたレイアウト

フォルダーを階層化することでレイアウトもネスト可能。上位のレイアウトが下位をラップする構造になる。

```
app/layout.tsx         ← ルートレイアウト
└── app/blog/layout.tsx  ← BlogLayout をラップ
      └── app/blog/page.tsx
```

```html
<!-- /blog にアクセスした場合 -->
<html>
  <body>
    <!-- RootLayout -->
    <nav>ブログナビ</nav>   <!-- BlogLayout -->
    <h1>Blog!!!</h1>       <!-- page.tsx -->
  </body>
</html>
```

### 動的セグメント（Dynamic Segments）

フォルダー名を `[]` で囲むことで動的セグメントを作成できる。

```
app/blog/[slug]/page.tsx → /blog/hello の slug = "hello"
```

```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>Blog post: {slug}</h1>
}
```

- `PageProps<T>` の型引数は**実際のファイル構造から自動生成**される（存在しないルートを指定するとコンパイルエラー）
- 型エラーはコンパイル時の警告のみで、ランタイムには影響しない

---

## 4. パラメータの処理とレンダリング

### `params` と `searchParams` の違い

| | URL例 | 取得できるもの |
|---|---|---|
| `params` | `/blog/123` | `{ id: "123" }` |
| `searchParams` | `/blog?sort=new` | `{ sort: "new" }` |

### Server / Client での `searchParams` の扱い

| 項目 | Server Component | Client Component |
|---|---|---|
| アクセス方法 | `searchParams` プロップを使用 | `useSearchParams()` フックを使用 |
| 主な用途 | DBからのフィルタリング・ページネーション | クライアント側でのリストフィルタリング |
| レンダリング | 動的レンダリングが強制される | 事前レンダリングされたルートでも使用可能 |

```tsx
// Server Component
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const keyword = (await searchParams).keyword
  return <p>{keyword}</p>
}

// Client Component
'use client'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get('keyword')
  return <p>{keyword}</p>
}
```

> **補足**：コールバックやイベントハンドラー内で検索パラメータを読み取る場合は、再レンダリングを避けるため `new URLSearchParams(window.location.search)` の使用が推奨される。

---

## 5. ナビゲーションと最適化

### `<Link>` と `useRouter` の使い分け

| | `<Link>` | `useRouter` |
|---|---|---|
| クリックで遷移 | ✅ 得意 | わざわざ使わない |
| 処理後に遷移 | ❌ できない | ✅ 得意 |
| 条件分岐で遷移先を変える | △ やりにくい | ✅ 得意 |

```tsx
// useRouter の典型例（フォーム送信後のリダイレクト）
'use client'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()

  const handleSubmit = async () => {
    await login()
    router.push('/dashboard') // 処理後に遷移
  }

  return <button onClick={handleSubmit}>ログイン</button>
}
```

- `<Link>` はプリフェッチ・クライアントサイドナビゲーションを提供し高速な遷移を実現
- `useRouter` は Client Component でしか使えない（`'use client'` が必要）

---

## 6. ルートプロップの型定義ヘルパー

`next dev` や `next build` の実行時に自動生成されるユーティリティ型。グローバルに利用可能で明示的なインポートは不要。

| 型 | 用途 | 含まれるもの |
|---|---|---|
| `PageProps` | ページコンポーネント用 | `params`、`searchParams` |
| `LayoutProps` | レイアウトコンポーネント用 | `children`、名前付きスロット |

```tsx
// PageProps の例
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
}

// LayoutProps の例
export default function Layout(props: LayoutProps<'/dashboard'>) {
  return <section>{props.children}</section>
}
```

> **補足**：静的なルートでは `params` は空のオブジェクト（`{}`）として解決される。

