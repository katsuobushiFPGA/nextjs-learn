# Next.js Learn まとめ

## 関数名の違い（`Page` vs `Home`）

`app/page.js` からの **default export** がルートのページコンポーネントとして認識される。関数名はルーティングに影響しない。

```tsx
export default function Page() { ... }  // チュートリアル推奨
export default function Home() { ... }  // テンプレートの慣習（ルートページ限定）
```

- `create-next-app` のテンプレートが `Home` を使うのはルートページ = ホームページという意味づけ
- チュートリアルが `Page` を使うのは全ルートで統一できるから

---

## レイアウトの「再レンダリングされない」の意味

「再レンダリングされない」= **ページ遷移時にレイアウト自体が再マウント・再レンダリングされない**という意味。通常のReactの再レンダリング（stateが変わったら再レンダリング）とは別の話。

```
/ → /dashboard に遷移したとき
  layout はそのまま維持 → page の部分だけ差し替え
```

| 状況 | レイアウトは再レンダリングされる？ |
|---|---|
| ページ遷移（`/` → `/about`） | ❌ されない |
| layout内のstateが変化 | ✅ される（普通のReact） |
| 親コンポーネントが再レンダリング | ✅ される（普通のReact） |

> `app/layout.tsx` はデフォルトで **Server Component** のため、stateを使うには `'use client'` が必要。

---

## `async` のある・なしの違い

Server Component は `async` にすることでコンポーネント内で `await` が使える。

```tsx
// データフェッチなし → async不要
export default function Page() {
  return <h1>About</h1>
}

// データフェッチあり → asyncが必要
export default async function Page() {
  const data = await fetchSomething()
  return <h1>{data.title}</h1>
}
```

- `await` を使わないなら `async` は付けない方がよい（不要なオーバーヘッド・可読性）
- チュートリアルが最初から `async` を付けているのは後でデータフェッチを追加する前提のテンプレートとして書いているから

---

## レイアウトのネスト

`app/layout.tsx` と `app/blog/layout.tsx` を定義した場合、**継承ではなくネストして適用**される。

```html
<!-- /blog にアクセスした場合 -->
<html>
  <body>
    <header>共通ヘッダー</header>   ← RootLayout
    <div>
      <nav>ブログナビ</nav>         ← BlogLayout
      <h1>Blog!!!</h1>             ← page.tsx
    </div>
  </body>
</html>
```

- 継承（上書き・拡張）ではなく、`children` として合成されたもの
- BlogLayout は RootLayout の存在を意識する必要がない

---

## `searchParams`

URLのクエリストリング（`?` 以降）を受け取るためのもの。

```
https://example.com/search?keyword=react&sort=new
```

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const keyword = (await searchParams).keyword
  return <p>{keyword}</p>
}
```

- `searchParams` という名前はWeb標準の `URLSearchParams` や `location.search` の流れを汲んだ命名

### `params` との違い

| | URL例 | 取得できるもの |
|---|---|---|
| `params` | `/blog/123` | `{ id: "123" }` |
| `searchParams` | `/blog?sort=new` | `{ sort: "new" }` |

### Server / Client での取得方法の違い

```tsx
// Server Component → props で受け取る
export default async function Page({ searchParams }) {
  const keyword = (await searchParams).keyword
}

// Client Component → useSearchParams() フックを使う
'use client'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const keyword = searchParams.get('keyword')
}
```

---

## Server Component と Client Component

| | Server Component | Client Component |
|---|---|---|
| イメージ | SSR / MPA寄り | CSR / SPA寄り |
| `useState` / `useEffect` | ❌ | ✅ |
| DBアクセス | ✅ | ❌ |
| `'use client'` | 不要 | 必要 |

- `'use client'` を書いたファイルはクライアントコンポーネントに「なる」（境界線の宣言）
- それ以降の子コンポーネントも全部 Client 扱いになる
- Client Component も**初回はサーバーでHTMLを生成**する（ハイドレーション）

### 歴史的な流れ

```
MPA（サーバーでHTML生成）
  ↓
CSR/SPA（ブラウザでJS実行）← SEO弱い・初回表示遅い・OGP効かない問題
  ↓
SSR復活（サーバーでHTML生成 + ハイドレーション）
  ↓
Next.js App Router（Server / Client を用途で使い分け）
```

---

## `<Link>` と `useRouter` の使い分け

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
    router.push('/dashboard')
  }

  return <button onClick={handleSubmit}>ログイン</button>
}
```

- `useRouter` は Client Component でしか使えない

---

## 動的ルート（Dynamic Segments）

```
app/blog/[slug]/page.tsx → /blog/hello の slug = "hello"
```

- `PageProps<'/blog/[slug]'>` の型引数は**実際のファイル構造から自動生成**される
- 存在しないルートを指定するとコンパイルエラー
- 型エラーはコンパイル時の警告のみで、ランタイムには影響しない

### 同じ階層に複数の動的セグメントは置かない

```
app/blog/[slug]/page.tsx   ✅
app/blog/[slug2]/page.tsx  ❌ コンフリクト
```

静的なパスは動的セグメントより優先される。

```
app/blog/new/page.tsx    → /blog/new（静的ルートが優先）
app/blog/[slug]/page.tsx → /blog/hello（new以外）
```

---

## Parallel Routes（並列ルート）

`@` プレフィックスのフォルダを作ることで、同じレイアウト内に複数のページを並列表示できる。

```
app/dashboard/
  layout.tsx
  page.tsx
  @analytics/
    page.tsx
```

```tsx
export default function Layout({ children, analytics }: {
  children: React.ReactNode
  analytics: React.ReactNode  // @analytics/page.tsx が入ってくる
}) {
  return (
    <section>
      {children}
      {analytics}
    </section>
  )
}
```

---

## ディレクトリ命名規則とCLI

| 記法 | 意味 |
|---|---|
| `[slug]` | 動的パラメータ |
| `(group)` | URLに影響しないグループ（Route Groups） |

CLIで操作する場合はクォートかバックスラッシュでエスケープが必要。

```bash
# クォートで囲む
cd "app/blog/[slug]"
mkdir "(dashboard)"

# バックスラッシュでエスケープ
cd app/blog/\[slug\]
mkdir \(dashboard\)
```

頻繁に作成する場合は Makefile にまとめると楽。

```makefile
create-route:
	mkdir -p "app/blog/[slug]"
	touch "app/blog/[slug]/page.tsx"
```

---

## API Reference

- [Linking and Navigating](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
- [layout.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [page.js](https://nextjs.org/docs/app/api-reference/file-conventions/page)
- [Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Dynamic Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

