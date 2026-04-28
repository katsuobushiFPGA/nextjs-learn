# 学習ロードマップ

## 現状の学習進捗

- ✅ Getting Started 全18章（公式ドキュメント読破）
- ✅ Dashboard App チュートリアル全15章（実装完了）
- ⬜ TASKS.md の実践課題（未着手）

---

## Phase 1 — 知識の定着・穴埋め（今すぐ）

TASKS.md の未完了課題をすべて実装する。「読んだ」→「書ける」に変換する段階。

| 優先度 | タスク |
|---|---|
| 🔴 高 | `app/not-found.tsx` / `error.tsx` の実装 |
| 🔴 高 | `"use client"` カウンターコンポーネント作成 |
| 🟡 中 | Route Groups でレイアウト分割 |
| 🟡 中 | `generateMetadata` で動的 OG タグ生成 |
| 🟢 低 | `prefetch={false}` のネットワーク比較実験 |

**目標：** 自分の言葉で RSC / App Router を説明できるようになる

---

## Phase 2 — 実践アプリの拡張（1〜2週間後）

`my-app` または新規アプリに以下の機能を追加して、実際のアプリ開発に近い体験をする。

1. **認証の実装** — NextAuth.js（Auth.js）でログイン機能
2. **DB 連携** — Prisma + Supabase（または Neon）で CRUD
3. **Server Actions の本格活用** — フォーム送信・楽観的更新
4. **テスト** — Vitest + React Testing Library で基本テスト

---

## Phase 3 — 深掘り・応用（1ヶ月後〜）

興味・目的に応じて以下の方向から選択する。

### 🅐 フルスタック方向
- Parallel Routes / Intercepting Routes（モーダルUI）
- Middleware での認証ガード・A/Bテスト
- ISR / on-demand revalidation の実装

### 🅑 パフォーマンス方向
- Lighthouse でスコア計測 → 改善サイクル
- Partial Prerendering（PPR）の実験
- Bundle Analyzer で不要依存を削減

### 🅒 OSS・チーム開発方向
- Storybook でコンポーネントカタログ
- GitHub Actions で CI/CD パイプライン構築
- Turborepo でモノレポ管理

---

## Phase 4 — アウトプット（継続的に）

`notes/` や既存のブログサマリを活かして：
- 学習内容を Zenn や Qiita に投稿する
- `my-app` を自分のポートフォリオ or プロダクトに育てる

---

## 💡 まず取り組むべきこと

**今日やること：** TASKS.md を開いて、`app/not-found.tsx` と `"use client"` カウンターを1つ実装する。理論は十分インプット済みなので、書く量を増やすのが最短ルート。
