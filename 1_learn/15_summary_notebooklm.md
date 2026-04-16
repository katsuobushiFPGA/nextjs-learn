# Next.js 16 Route Handlers まとめ

## 概要

`app` ディレクトリ内で Web 標準の `Request` / `Response` API を使ってカスタムリクエストハンドラーを定義する仕組み。`pages` ディレクトリの API Routes に相当し、併用不要。

---

## 基本規則

- `app` ディレクトリ内の `route.js` / `route.ts` で定義
- `page.js` や `layout.js` と同様に任意の深さにネスト可能
- **同じルートセグメントに `page.js` と `route.js` を共存させることは不可**

| page 配置 | route 配置 | 結果 |
|---|---|---|
| `app/page.js` | `app/route.js` | ❌ 競合 |
| `app/page.js` | `app/api/route.js` | ✅ 有効 |
| `app/[user]/page.js` | `app/api/route.js` | ✅ 有効 |

---

## サポートされる HTTP メソッド

`GET` / `POST` / `PUT` / `PATCH` / `DELETE` / `HEAD` / `OPTIONS`

未対応メソッドが呼ばれた場合は `405 Method Not Allowed` を自動返却。

---

## API 拡張

- `NextRequest` — 高度なユースケース向けヘルパー付きのリクエストオブジェクト
- `NextResponse` — レスポンス生成を簡素化するヘルパー付きのレスポンスオブジェクト

---

## キャッシング

- **デフォルト: キャッシュなし**
- `GET` のみオプトイン可能

```ts
export const dynamic = 'force-static'
```

- `POST` / `PUT` / `PATCH` / `DELETE` は、同ファイルで GET がキャッシュ設定されていてもキャッシュ対象外

---

## 特殊な Route Handlers

`sitemap.ts` / `opengraph-image.tsx` / `icon.tsx` などのメタデータファイルは特殊な Route Handler として扱われ、Dynamic API やダイナミック設定を使わない限りデフォルトで静的生成される。

---

## TypeScript サポート

- グローバルな `RouteContext` ヘルパーで `context` パラメータに型付け可能
- 型は `next dev` / `next build` / `next typegen` 実行時に自動生成

---

## まとめ

Route Handlers はレイアウトやクライアントナビゲーションに関与しない独立したプリミティブ。静的・動的な挙動を厳密に制御しながら、`app` ルーター環境でのバックエンド機能を柔軟に構築できる。
