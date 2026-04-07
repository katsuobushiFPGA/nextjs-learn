# 推奨課題リスト

学習内容を定着させるための実践課題。

---

## my-app 実践課題

### ルーティング・レイアウト

- [ ] `app/not-found.tsx` を作成して 404 ページを実装する
- [ ] `app/blog/[slug]/error.tsx` を作成してエラーハンドリングページを実装する
- [ ] `app/blog/[slug]/loading.tsx` のコメントアウトを外し、ローディング UI を実装する
- [ ] Route Groups（`(group)`構文）を使って、ブログとその他のページでレイアウトを分ける

### Server / Client コンポーネント

- [ ] `"use client"` を使ったインタラクティブなコンポーネント（ボタンのカウンターなど）を作る
- [ ] Server Component でデータ取得（`fetch`）を試す
- [ ] Server Component と Client Component を組み合わせたページを作る

### ナビゲーション・UX

- [ ] `useRouter` を使ったプログラム的ナビゲーションを試す
- [ ] `searchParams` を使った検索フィルタを `app/page.tsx` に実装する
- [ ] `Link` の `prefetch={false}` と通常の `Link` で DevTools のネットワークタブを比較する

### メタデータ

- [ ] 各ページに静的 `metadata` を追加する（title, description）
- [ ] 動的ルートで `generateMetadata` を使って動的 OG タグを生成する

---

## Dashboard App チュートリアル

https://nextjs.org/learn/dashboard-app を実際に手を動かして進める。

- [ ] `dashboard-app/` ディレクトリを作成し、`create-next-app` でセットアップする
- [ ] チュートリアルの各章を `1_learn/` に倣ってノートを残しながら進める

---

## 理解確認

- [ ] App Router と Pages Router の違いを自分の言葉でまとめる
- [ ] RSC（React Server Components）がなぜパフォーマンス向上につながるか説明できるようにする
- [ ] `loading.tsx` / `error.tsx` / `not-found.tsx` それぞれの役割と発動条件を整理する
