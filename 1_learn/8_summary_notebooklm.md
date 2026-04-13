# Next.js Server Functions 実装ガイド まとめ

## 1. 基本概念

- サーバー側で実行される非同期関数。クライアントからネットワークリクエスト経由で呼び出す
- 内部的には HTTP POST を使用
- `form` の `action` や `button` の `formAction` 経由で自動実行される場合は **Server Actions** と呼ぶ
- 実行後、キャッシュ再検証・リダイレクト・Cookie 操作をシームレスに処理し、ページを再レンダリングする

---

## 2. 作成方法

`'use server'` ディレクティブで定義する。

| コンポーネント種別 | 定義・使用方法 |
|---|---|
| Server Components | 関数本体の最上部に `'use server'` を書いてインライン定義可能 |
| Client Components | 直接定義不可。別ファイルからインポートして使用する |
| props 経由 | Server Component で定義した Action を Client Component へ props として渡すことも可能 |

### Progressive Enhancement

| 状況 | 挙動 |
|---|---|
| Server Component 内のフォーム | JS 無効でも送信可能 |
| Client Component 内のフォーム | JS 読み込み完了までキューイング、ハイドレーション後にページリフレッシュなしで処理 |

---

## 3. 呼び出し方

### フォーム

```tsx
<form action={createPost}>
  <input name="content" />
  <button type="submit">投稿</button>
</form>
```

`action` に渡すと関数は自動的に `FormData` を受け取る。

### イベントハンドラー

```tsx
<button onClick={() => deletePost(id)}>削除</button>
```

### useEffect

```tsx
useEffect(() => {
  incrementViews()
}, [])
```

ビュー数更新・無限スクロール・ショートカットキーなどに活用。

---

## 4. 更新後の処理

### pending 状態管理

```tsx
const [state, action, pending] = useActionState(createPost, null)
// pending が true の間はローディング表示
```

### キャッシュ再検証

```ts
revalidatePath('/posts')   // 特定パスを再検証
revalidateTag('posts')     // 特定タグに紐づくデータを再検証
```

### リダイレクト

```ts
revalidatePath('/dashboard') // redirect より前に呼ぶ
redirect('/dashboard')       // 例外スロー → 以降のコードは実行されない
```

### Cookie 操作

```ts
cookies().set('session', token)  // セット後、即座に UI に反映される
cookies().delete('session')
```

Cookie を変更すると Next.js がサーバー側で現在のページを再レンダリングし、即座に新しい値が反映される。

---

## 5. 設計上の注意点

| 項目 | 内容 |
|---|---|
| 実行の順次性 | クライアントは Action を1つずつディスパッチして待機する。並列処理が必要な場合は単一 Action 内で並列実行するか Route Handler を使う |
| クライアント状態の保持 | 再レンダリングが発生しても Client Component の状態は保持される。ただし Effect の再実行には注意 |
| `redirect` の例外処理 | `redirect` は例外をスローするため `try/catch` で囲むと捕捉されてしまう |
