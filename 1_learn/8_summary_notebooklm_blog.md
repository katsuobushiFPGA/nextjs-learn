# Next.js 16 Server Functions まとめ

## 概要

フロントエンドからサーバーのデータを更新するために必要だった「APIエンドポイント設計・fetch処理・状態管理・UI同期」といった一連の作業を、Server Functions が大幅に簡略化する。

---

## 用語整理

| 用語 | 意味 |
|---|---|
| Server Functions | `'use server'` で定義された、サーバー上で実行される非同期関数の総称 |
| Server Actions | Server Functions のうち、`form action` や `startTransition` などのミューテーションコンテキストで使われるもの |

---

## 5つのポイント

### 1. APIエンドポイントが不要になる

`'use server'` を付けた async 関数を定義するだけで、クライアントから直接呼び出せる。内部的には自動的に POST リクエストとして処理される。

- URL 管理不要
- HTTP メソッドの選択不要
- 「APIを構築する」→「関数を書いて呼び出す」へ

---

### 2. JS なしでも動く（Progressive Enhancement）

Server Components でフォームの `action` に Server Function を渡した場合、JS が無効な環境でも動作する。

Client Components の場合も、JS 読み込み前にフォームが送信されるとリクエストがキューに蓄積され、ハイドレーション完了後に実行される。

---

### 3. 単一ラウンドトリップで UI が更新される

`revalidatePath` / `revalidateTag` を Action 内で呼ぶと、**データ更新と最新 UI の取得が1回のサーバー往復で完結する**。

```ts
async function createPost(formData: FormData) {
  'use server'
  await db.insert(...)
  revalidatePath('/posts') // → 更新 + 最新 UI を一括で返す
}
```

手動でクライアント側の状態を書き換えるコードが不要になる。

---

### 4. Cookie 操作が UI 再レンダリングのトリガーになる

Action 内で `cookies().set()` / `delete()` を実行すると、それが UI 更新のトリガーとして機能する。

- ログイン処理で認証 Cookie をセットした瞬間、サーバー側でレイアウトが再レンダリングされログイン後の UI に切り替わる
- スクロール位置や入力値などのクライアント側の状態は保持される（フルリロードではない）

---

### 5. `redirect` は例外をスローする制御フロー

`redirect` は戻り値ではなく**例外をスローして処理を中断する**。そのため以降のコードは実行されない。

```ts
async function updateAndFinish() {
  'use server'

  revalidatePath('/dashboard') // ← redirect より前に呼ぶ必要がある
  redirect('/dashboard')       // ← ここで例外スロー、以降は実行されない
}
```

`try/catch` で囲むと `redirect` が捕捉されてしまうため注意。

---

## まとめ

Server Functions はフロントエンドとバックエンドの通信という概念を解体し、アプリケーションを「地続きなプログラム」として記述可能にする。API 構築のコストを削減し、ロジックをサーバー上の関数として定義するだけでクライアントとシームレスに繋がる。
