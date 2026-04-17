# nextjs-learn

Next.js 公式ドキュメントを読み進めながら学習するリポジトリ。

## ディレクトリ構成

```
nextjs-learn/
├── 1_learn/          # 学習ノート（Markdown）
├── my-app/           # 実践用 Next.js アプリ（Getting Started 用）
└── nextjs-dashboard/ # Dashboard App チュートリアル用
```

### `1_learn/` — 学習ノート

公式ドキュメントの各章を読んだメモ・要約・AI への質問まとめ。

| ファイル | 内容 |
|---|---|
| `1_installation.md` | インストール・初期設定 |
| `2_project-structure.md` | プロジェクト構造 |
| `3_layouts-and-pages.md` | レイアウトとページ |
| `4_linking-and-navigating.md` | リンクとナビゲーション、プリフェッチ |
| `5_server-and-client-components.md` | Server / Client コンポーネントの使い分け |
| `6_cache-components.md` | Cache Components（`'use cache'`）と Suspense |
| `7_fetching-data.md` | データの取得（Server / Client、ストリーミング） |
| `*_summary_notebooklm.md` | NotebookLM による章まとめ |
| `*_ai_question_summary.md` | AI への質問と回答まとめ |

### `my-app/` — Next.js アプリ

学習内容を試すための実践アプリ。

- **Next.js 16.2.2** / **React 19** / **TypeScript**
- **Tailwind CSS v4** / **ESLint** / **App Router**

#### ルート構成

```
app/
├── layout.tsx               # ルートレイアウト（ナビゲーション含む）
├── page.tsx                 # トップページ（searchParams デモ）
├── actions.ts               # Server Actions（投稿作成・いいね）
├── client-component.tsx     # Server Actions を受け取るデモ用クライアントコンポーネント
├── like-button.tsx          # いいねボタン（Client Component）
├── proxy.ts                 # プロキシ設定
├── sitemap.ts               # サイトマップ生成
├── about/
│   └── page.tsx             # About ページ
├── api/
│   └── route.ts             # Route Handler
├── components/
│   └── Loading.tsx          # 共通ローディング UI
├── lib/
│   └── actions.ts           # Server Actions（インライン定義版）
├── ui/
│   ├── button.tsx           # フォーム送信ボタン
│   └── form.tsx             # フォームコンポーネント
└── blog/
    ├── layout.tsx           # ブログ共通レイアウト
    ├── page.tsx             # ブログ一覧
    ├── blog.module.css      # CSS モジュール
    └── [slug]/
        ├── page.tsx         # ブログ詳細（動的ルート）
        ├── loading.tsx      # ローディング UI
        ├── not-found.tsx    # 404 ページ
        └── [slug2]/
            └── page.tsx     # ネストした動的ルート
```

## 開発サーバーの起動

```bash
cd my-app
npm install
npm run dev
```

`http://localhost:3000` でアクセス可能。

## 学習進捗

### Getting Started（nextjsjp.org）

- [x] [インストール](https://nextjsjp.org/docs/app/getting-started/installation)
- [x] [プロジェクト構造](https://nextjsjp.org/docs/app/getting-started/project-structure)
- [x] [レイアウトとページ](https://nextjsjp.org/docs/app/getting-started/layouts-and-pages)
- [x] [リンクとナビゲーション](https://nextjsjp.org/docs/app/getting-started/linking-and-navigating)
- [x] [Server コンポーネントと Client コンポーネント](https://nextjsjp.org/docs/app/getting-started/server-and-client-components)
- [x] [Cache Components](https://nextjsjp.org/docs/app/getting-started/cache-components)
- [x] [データの取得](https://nextjsjp.org/docs/app/getting-started/fetching-data)
- [x] [データの更新](https://nextjsjp.org/docs/app/getting-started/updating-data)
- [x] [キャッシングと再検証](https://nextjsjp.org/docs/app/getting-started/caching-and-revalidating)
- [x] [エラーハンドリング](https://nextjsjp.org/docs/app/getting-started/error-handling)
- [x] [CSS](https://nextjsjp.org/docs/app/getting-started/css)
- [x] [画像の最適化](https://nextjsjp.org/docs/app/getting-started/images)
- [x] [フォント最適化](https://nextjsjp.org/docs/app/getting-started/fonts)
- [x] [メタデータと OG 画像](https://nextjsjp.org/docs/app/getting-started/metadata-and-og-images)
- [x] [Route Handlers](https://nextjsjp.org/docs/app/getting-started/route-handlers)
- [x] [Proxy](https://nextjsjp.org/docs/app/getting-started/proxy)
- [x] [デプロイ](https://nextjsjp.org/docs/app/getting-started/deploying)
- [x] [アップグレード](https://nextjsjp.org/docs/app/getting-started/upgrading)

### Dashboard App（nextjs.org/learn）

- [x] [Getting Started](https://nextjs.org/learn/dashboard-app/getting-started)
- [x] [CSS Styling](https://nextjs.org/learn/dashboard-app/css-styling)
- [x] [Optimizing Fonts and Images](https://nextjs.org/learn/dashboard-app/optimizing-fonts-images)
- [x] [Creating Layouts and Pages](https://nextjs.org/learn/dashboard-app/creating-layouts-and-pages)
- [x] [Navigating Between Pages](https://nextjs.org/learn/dashboard-app/navigating-between-pages)
- [x] [Setting Up Your Database](https://nextjs.org/learn/dashboard-app/setting-up-your-database)
- [x] [Fetching Data](https://nextjs.org/learn/dashboard-app/fetching-data)
- [x] [Static and Dynamic Rendering](https://nextjs.org/learn/dashboard-app/static-and-dynamic-rendering)
- [x] [Streaming](https://nextjs.org/learn/dashboard-app/streaming)
- [x] [Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination)
- [x] [Mutating Data](https://nextjs.org/learn/dashboard-app/mutating-data)
- [ ] [Handling Errors](https://nextjs.org/learn/dashboard-app/error-handling)
- [ ] [Improving Accessibility](https://nextjs.org/learn/dashboard-app/improving-accessibility)
- [ ] [Adding Authentication](https://nextjs.org/learn/dashboard-app/adding-authentication)
- [ ] [Adding Metadata](https://nextjs.org/learn/dashboard-app/adding-metadata)
