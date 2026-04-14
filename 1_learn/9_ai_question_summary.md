# Next.js キャッシュ・設計メモ

## Client ComponentでのFetch

Client Componentはブラウザ環境で動くため、`fetch` はグローバルに使用可能。`useEffect` やイベントハンドラ内で直接呼び出せる。

ただし Next.js の `fetch` 拡張（`cache` / `next.revalidate` オプション）はサーバー側でのみ有効で、Client Component では無視される。

---

## unstable_cache

データベースクエリなどの非同期関数の結果をキャッシュする関数。

```ts
const getCachedUser = unstable_cache(
  async () => getUserById(userId),
  [userId], // キャッシュキー
  {
    tags: ['user'],    // オンデマンド無効化用ラベル
    revalidate: 3600,  // TTL（秒）
  }
)
```

### tagsとrevalidateの違い

| オプション | 役割 |
|---|---|
| `revalidate` | 時間ベースのTTL（何秒後に再検証） |
| `tags` | `revalidateTag()` によるオンデマンド無効化のラベル |

### サイズ制限

- 1エントリあたりデフォルト **2MB** の上限（`MAX_FETCH_SIZE` 環境変数で変更可能）
- エントリ数の上限は特になく、`cacheMaxMemorySize` を設定しないとメモリが際限なく増加する

### 注意

`unstable_cache` は **Next.js 16 で `use cache` ディレクティブに置き換えられた**。

---

## Model層への集約

CRUDとキャッシュ制御をModel層に閉じ込めることで、「更新したのにキャッシュが残っていた」という事故を防ぐ。

```ts
// model/user.ts
const TAG = 'user'

// 読み取り：キャッシュあり
export const getCachedUser = (id: string) =>
  unstable_cache(
    () => db.select().from(users).where(eq(users.id, id)).then(r => r[0]),
    [id],
    { tags: [TAG], revalidate: 3600 }
  )()

// 書き込み：無効化とセット
export async function updateUser(id: string, data: Partial<User>) {
  await db.update(users).set(data).where(eq(users.id, id))
  revalidateTag(TAG) // 更新と同じファイルにあるので漏れない
}
```

---

## 3層構成とトランザクション

```
Page / Server Action
    ↓
Service層（ビジネスロジック）
    ↓
Model層（CRUD + キャッシュ制御）
    ↓
DB
```

- **Model層**：「何をDBに書くか」のみ知っている
- **Service層**：「なぜ書くか」を知っている

### トランザクションはService層に持たせる

「どのModel操作をひとまとめにすべきか」を知っているのはService層だけなので、トランザクションの境界もそこに置く。

実装上は `tx`（トランザクションコネクション）をModel層に渡せる設計にしておく。

```ts
// model/user.ts
export async function updateUser(id: string, data: Partial<User>, tx?: Transaction) {
  const client = tx ?? db
  await client.update(users).set(data).where(eq(users.id, id))
  revalidateTag('user')
}

// service/user.ts
export async function promoteToAdmin(userId: string) {
  await db.transaction(async (tx) => {
    await updateUser(userId, { role: 'admin' }, tx)
    await createAuditLog({ userId, action: 'promote' }, tx)
  })
  // 例外が投げられたら自動でROLLBACK、正常終了でCOMMIT
}
```

`tx` を渡さない場合は通常のDBコネクションで動くため、単純なCRUDではService層を経由しなくてもよい。

---

## awaitとfire-and-forget

基本的にはawaitで待つが、「結果を待たずに次に進んでいい」ケースではawait不要。意図的にfireして忘れる場合は `void` を付けて明示する。

```ts
void sendAnalyticsEvent(userId) // 意図的にfire-and-forget
await updateUser(userId, data)  // こちらは待つ
```

**トランザクション内では必ずawaitが必要。** awaitしないとコールバックが先に終了し、Drizzleが正常終了と判断してCOMMITしてしまう。

---

## SWRとキャッシュ戦略

### revalidateTagのprofile="max"（SWR）

バックグラウンドで新しいコンテンツを取得しながら、その間は古いコンテンツを返す。

### データの性質別キャッシュ戦略

| データの性質 | 戦略 |
|---|---|
| 多少古くてOK（ランキング、記事一覧など） | SWR（stale-while-revalidate） |
| 更新タイミングが明確（在庫、残席など） | キャッシュ＋即時無効化（`revalidateTag`） |
| 常に最新必須（残高、決済情報など） | キャッシュしない |

### キャッシュが有効なデータ

- マスターデータ（都道府県一覧、カテゴリ一覧など）
- ユーザーに依存しない公開データ（トップページの一覧など）
- 集計系（ランキング、統計）

### キャッシュが難しいデータ

- ユーザーごとに異なるデータ（マイページ、予約状況）
- 更新頻度が高いデータ

### 実務的な観点

トラフィックが少ない初期は過剰設計になりがち。最初から全部キャッシュするより、**後から入れやすい構造**（Model層への集約など）にしておく方が現実的。
