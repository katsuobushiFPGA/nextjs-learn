# Next.js Route Handlers まとめ

## キャッシュの確認方法

### レスポンスヘッダーで確認（一番手軽）

DevTools → Network タブで `x-nextjs-cache` ヘッダーを確認する。

| 値 | 意味 |
|---|---|
| `HIT` | キャッシュから返った |
| `MISS` | キャッシュなし（初回など） |
| `STALE` | キャッシュ期限切れだが返した（再検証中） |
| `BYPASS` | キャッシュをスキップした |

### `force-static` とキャッシュ

```ts
export const dynamic = 'force-static'

export async function GET(request: Request) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await res.json()
  return Response.json({ data })
}
```

- `force-static` はルート全体をビルド時に静的生成（SSG）する指示
- Next.js 15 から `fetch` のデフォルトは `no-store`（キャッシュしない）だが、`force-static` の場合はルートごとキャッシュされるので fetch の設定は関係なくなる
- 定期的に更新したければ `revalidate` と組み合わせる

```ts
export const revalidate = 60 // 60秒ごとに再生成（ISR）
```

---

## 特殊なRoute Handlers（メタデータファイル）

`app/` ディレクトリに特定のファイル名で置くと、対応するURLが自動的に生成される。

| ファイル | アクセスURL |
|---|---|
| `app/sitemap.ts` | `/sitemap.xml` |
| `app/opengraph-image.tsx` | `/opengraph-image` |
| `app/icon.tsx` | `/icon` |
| `app/robots.ts` | `/robots.txt` |
| `app/blog/sitemap.ts` | `/blog/sitemap.xml` |

- Next.js はベース名（`sitemap`）だけ見てURLと出力フォーマットを決める（`.ts` / `.tsx` は実装言語の拡張子）
- Dynamic APIや動的設定オプションを使わない限り、デフォルトで静的生成される

### `public/` との違い

| 方法 | アクセスURL | 向いてるケース |
|---|---|---|
| `public/sitemap.xml` | `/sitemap.xml` | 内容が固定・手動管理でOK |
| `app/sitemap.ts` | `/sitemap.xml` | DBやCMSからページ一覧を動的に生成したい |

- `public/` はルートパス `/` にそのままマッピングされる（ディレクトリ名はURLに含まれない）
- `app/sitemap.ts` と `public/sitemap.xml` を同時に置くと **ビルドエラー**になる（共存不可）

```
A conflicting public file and page file was found for path /sitemap.xml
```

### `app/` に静的ファイルは置けない

`app/` はルーティング・コードの領域なので、静的ファイルを置いても配信されない。静的ファイルは `public/` 一択。

---

## ルート解決の優先順位

- 静的セグメントが動的セグメントより優先される
- 同じルートに `route.js` と `page.js` を共存させることはできない

```
app/
  page.ts   ← そのルートの全HTTPメソッドを制御
  route.ts  ← 競合するため NG
```

| Page | Route | 結果 |
|---|---|---|
| `app/page.js` | `app/route.js` | 競合（NG） |
| `app/page.js` | `app/api/route.js` | 有効 |
| `app/[user]/page.js` | `app/api/route.js` | 有効（`/api` は静的セグメントが優先） |

---

## Route Handlersの使いどころ

### 向いているケース

- 外部サービス（モバイルアプリ・他サービス）へAPIを公開する
- StripeやGitHubなどWebhookの受け口
- サードパーティOAuthのコールバック処理

### 向いていないケース（代替手段を使う）

| やりたいこと | 使うもの |
|---|---|
| データ取得 | RSC（Server Component で直接 fetch） |
| データ更新（フォームやボタン） | Server Actions |
| 外部サービスへAPIを公開 | Route Handlers |

同一アプリ内でフロントとバックが完結するなら、Route Handler を経由する必要はない。

---

## フロントエンドから外部APIへのリクエスト

基本はRSC経由で行う。

**RSC経由のメリット**
- APIキーをクライアントに露出しない
- CORSを回避できる
- サーバー上でfetchするのでネットワーク的に有利
- Suspense と Streaming で段階的に表示できる

```tsx
<Suspense fallback={<Loading />}>
  <UserProfile /> {/* RSC内でawait fetch */}
</Suspense>
```

**クライアントから直接叩いてもよいケース**
- APIキー不要で公開されている
- CORSも許可している（地図APIやパブリックなデータAPIなど）

---

## RouteContext ヘルパー

TypeScript で `ctx.params` に型を付けるためのグローバルヘルパー。

```ts
import type { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/users/[id]'>) {
  const { id } = await ctx.params
  return Response.json({ id })
}
```

- ルートのパス文字列を渡すだけで `params` の中身の型が自動推論される
- `params` が `Promise<...>` なのは Next.js 15 から `params` が非同期になったため
- `id` は常に `string` として推論される。`number` が必要な場合は自分でパースしてバリデーションする

```ts
const { id } = await ctx.params
const idNum = Number(id)
if (isNaN(idNum)) {
  return Response.json({ error: 'Invalid id' }, { status: 400 })
}
```
