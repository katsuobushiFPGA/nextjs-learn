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

公式ドキュメントの各章を読んだメモ・要約・AI への質問まとめ。各章の「メインノート」「NotebookLM サマリ」「AI Q&A」へのリンク一覧：

| 章 | メインノート | NotebookLM サマリ | AI Q&A |
|---|---|---|---|
| 1. Installation | [1_installation.md](1_learn/1_installation.md) | - | - |
| 2. Project Structure | [2_project-structure.md](1_learn/2_project-structure.md) | [summary](1_learn/2_summary_notebooklm.md) | - |
| 3. Layouts and Pages | [3_layouts-and-pages.md](1_learn/3_layouts-and-pages.md) | [summary](1_learn/3_summary_notebooklm.md) | [Q&A](1_learn/3_ai_question_summary.md) |
| 4. Linking and Navigating | [4_linking-and-navigating.md](1_learn/4_linking-and-navigating.md) | [summary](1_learn/4_summary_notebooklm.md) / [blog](1_learn/4_summary_notebooklm_blog.md) | [Q&A](1_learn/4_ai_question_summary.md) |
| 5. Server and Client Components | [5_server-and-client-components.md](1_learn/5_server-and-client-components.md) | [summary](1_learn/5_summary_notebooklm.md) / [blog](1_learn/5_summary_notebooklm_blog.md) | [Q&A](1_learn/5_ai_question_summary.md) |
| 6. Cache Components | [6_cache-components.md](1_learn/6_cache-components.md) | [summary](1_learn/6_summary_notebooklm.md) / [blog](1_learn/6_summary_notebooklm_blog.md) | [Q&A](1_learn/6_ai_question_summary.md) |
| 7. Fetching Data | [7_fetching-data.md](1_learn/7_fetching-data.md) | [summary](1_learn/7_summary_notebooklm.md) / [blog](1_learn/7_summary_notebooklm_blog.md) | [Q&A](1_learn/7_ai_question_summary.md) |
| 8. Updating Data | - | [summary](1_learn/8_summary_notebooklm.md) / [blog](1_learn/8_summary_notebooklm_blog.md) | [Q&A](1_learn/8_ai_question_summary.md) |
| 9. Caching and Revalidating | - | [summary](1_learn/9_summary_notebooklm.md) / [blog](1_learn/9_summary_notebooklm_blog.md) | [Q&A](1_learn/9_ai_question_summary.md) |
| 10. Error Handling | - | [summary](1_learn/10_summary_notebooklm.md) / [blog](1_learn/10_summary_notebooklm_blog.md) | [Q&A](1_learn/10_ai_question_summary.md) |
| 11. CSS | - | [summary](1_learn/11_summary_notebooklm.md) / [blog](1_learn/11_summary_notebooklm_blog.md) | [Q&A](1_learn/11_ai_question_summary.md) |
| 12. Images | - | [summary](1_learn/12_summary_notebooklm.md) / [blog](1_learn/12_summary_notebooklm_blog.md) | [Q&A](1_learn/12_ai_question_summary.md) |
| 13. Fonts | - | [summary](1_learn/13_summary_notebooklm.md) / [blog](1_learn/13_summary_notebooklm_blog.md) | [Q&A](1_learn/13_ai_question_summary.md) |
| 14. Metadata and OG Images | - | [summary](1_learn/14_summary_notebooklm.md) / [blog](1_learn/14_summary_notebooklm_blog.md) | [Q&A](1_learn/14_ai_question_summary.md) |
| 15. Route Handlers | - | [summary](1_learn/15_summary_notebooklm.md) | [Q&A](1_learn/15_ai_question_summary.md) |
| 16. Proxy | - | [summary](1_learn/16_summary_notebook.md) / [blog](1_learn/16_summary_notebooklm_blog.md) | - |
| 17. Deploying | - | [summary](1_learn/17_summary_notebooklm.md) / [blog](1_learn/17_summary_notebooklm_blog.md) | - |
| 18. Upgrading | - | [summary](1_learn/18_summary_notebooklm.md) / [blog](1_learn/18_summary_notebooklm_blog.md) | - |

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

- [x] [インストール](https://nextjsjp.org/docs/app/getting-started/installation) — [ノート](1_learn/1_installation.md)
- [x] [プロジェクト構造](https://nextjsjp.org/docs/app/getting-started/project-structure) — [ノート](1_learn/2_project-structure.md)
- [x] [レイアウトとページ](https://nextjsjp.org/docs/app/getting-started/layouts-and-pages) — [ノート](1_learn/3_layouts-and-pages.md)
- [x] [リンクとナビゲーション](https://nextjsjp.org/docs/app/getting-started/linking-and-navigating) — [ノート](1_learn/4_linking-and-navigating.md)
- [x] [Server コンポーネントと Client コンポーネント](https://nextjsjp.org/docs/app/getting-started/server-and-client-components) — [ノート](1_learn/5_server-and-client-components.md)
- [x] [Cache Components](https://nextjsjp.org/docs/app/getting-started/cache-components) — [ノート](1_learn/6_cache-components.md)
- [x] [データの取得](https://nextjsjp.org/docs/app/getting-started/fetching-data) — [ノート](1_learn/7_fetching-data.md)
- [x] [データの更新](https://nextjsjp.org/docs/app/getting-started/updating-data) — [サマリ](1_learn/8_summary_notebooklm.md)
- [x] [キャッシングと再検証](https://nextjsjp.org/docs/app/getting-started/caching-and-revalidating) — [サマリ](1_learn/9_summary_notebooklm.md)
- [x] [エラーハンドリング](https://nextjsjp.org/docs/app/getting-started/error-handling) — [サマリ](1_learn/10_summary_notebooklm.md)
- [x] [CSS](https://nextjsjp.org/docs/app/getting-started/css) — [サマリ](1_learn/11_summary_notebooklm.md)
- [x] [画像の最適化](https://nextjsjp.org/docs/app/getting-started/images) — [サマリ](1_learn/12_summary_notebooklm.md)
- [x] [フォント最適化](https://nextjsjp.org/docs/app/getting-started/fonts) — [サマリ](1_learn/13_summary_notebooklm.md)
- [x] [メタデータと OG 画像](https://nextjsjp.org/docs/app/getting-started/metadata-and-og-images) — [サマリ](1_learn/14_summary_notebooklm.md)
- [x] [Route Handlers](https://nextjsjp.org/docs/app/getting-started/route-handlers) — [サマリ](1_learn/15_summary_notebooklm.md)
- [x] [Proxy](https://nextjsjp.org/docs/app/getting-started/proxy) — [サマリ](1_learn/16_summary_notebook.md)
- [x] [デプロイ](https://nextjsjp.org/docs/app/getting-started/deploying) — [サマリ](1_learn/17_summary_notebooklm.md)
- [x] [アップグレード](https://nextjsjp.org/docs/app/getting-started/upgrading) — [サマリ](1_learn/18_summary_notebooklm.md)

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
