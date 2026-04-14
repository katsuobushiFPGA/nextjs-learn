# Next.js キャッシング ベストプラクティス

## 1. fetchのデフォルトは「キャッシュなし」

`fetch` リクエストはデフォルトではキャッシュされない。キャッシュを有効にするには `cache: 'force-cache'` を明示的に指定する。

```ts
const data = await fetch('https://api.example.com/data', { cache: 'force-cache' })
```

### 落とし穴

`fetch` をキャッシュしない設定でも、Next.js はルートをプリレンダリングして HTML をキャッシュしてしまう。「開発環境では動くが本番でデータが更新されない」という現象の正体はこれ。

ルートを完全に動的に保ちたい場合は `connection` APIを使う。

---

## 2. unstable_cache：fetch以外の非同期処理をキャッシュする

DBクエリやSDK経由の呼び出しなど、`fetch` を使わない処理のキャッシュに使用する。

```ts
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (id: string) => getUserById(id),
  ['user-cache-key'],  // キャッシュキー
  {
    tags: ['user'],    // 再検証用タグ
    revalidate: 3600,  // TTL（秒）
  }
)
```

DB負荷の抑制とレスポンスタイムの改善に有効。

---

## 3. revalidateTag：profile="max" が推奨

タグベースでキャッシュをオンデマンド再検証する。現在は `profile="max"` の指定が推奨。

```ts
import { revalidateTag } from 'next/cache'

export async function updateUser(id: string) {
  // データ更新処理...

  revalidateTag('user', 'max') // 推奨：SWRセマンティクス
}
```

`profile="max"` を指定すると stale-while-revalidate（SWR）の挙動になり、バックグラウンドで新しいデータを取得しながら古いキャッシュを即座に返すため、ユーザーを待たせない。

引数なし（即時削除）は**非推奨**。

---

## 4. updateTag：Server Action専用の即時無効化

自分の書き込み直後の読み取り（read-after-write）に特化したAPI。Server Action内でのみ使用可能。

```ts
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const post = await db.post.create({ ... })

  updateTag('posts') // 即時期限切れ

  redirect(`/posts/${post.id}`)
}
```

`revalidateTag` の SWR と異なり、遷移先のページで一瞬の遅延もなく最新データを表示したい場合に使う。

---

## 5. revalidatePath vs revalidateTag

| API | 判断基準 | 例 |
|---|---|---|
| `revalidatePath` | 特定のページ（URL）全体をリフレッシュしたい | `/profile` ページの設定更新 |
| `revalidateTag` | 特定のデータが複数ページを横断して使われている | ヘッダー・設定画面・投稿者欄など各所の「ユーザー情報」 |

- **データ層の変更を伝播させる** → `revalidateTag`
- **特定の画面構成を更新する** → `revalidatePath`

---

## まとめ：2つの使い分け

| シナリオ | 使うAPI |
|---|---|
| 通常のデータ更新（多少の遅延OK） | `revalidateTag('tag', 'max')` |
| ユーザー自身の書き込み直後の即時反映 | `updateTag('tag')` |
