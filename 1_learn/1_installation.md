## Installation

以下ページに従ってインストールを進めていく。  
<https://nextjs.org/docs/app/getting-started/installation>  

## 実行するコマンド

`npm`を使うので、`npm`のタブに記載されているコマンドを実行する。  

```bash
npx create-next-app@latest my-app --yes
cd my-app
npm run dev
```

> --yesオプションを使用すると、保存済みの設定やデフォルト設定を使ってプロンプトをスキップできます。
> デフォルトのセットアップでは、TypeScript、Tailwind CSS、ESLint、App Router、Turbopackが有効になり、インポートエイリアスには「@/*」が設定されます。
> また、コーディングエージェントが最新のNext.jsコードを作成できるようガイドするための「AGENTS.md」（およびそれを参照する「CLAUDE.md」）も含まれます。

ってことらしい。  
結構入ってくるね。  
このあたりのエコシステムも知っておこう。  

- TypeScript
- Tailwind CSS
- ESLint
- App Router
- Turbopack

## 動作環境

- Node.jsの最小バージョン：20.9
- 対応OS：macOS、Windows（WSLを含む）、Linux

この辺は大丈夫だね。  

## 対応ブラウザ

- Chrome 111+
- Edge 111+
- Firefox 111+
- Safari 16.4以降

これもまあ大丈夫ですね。  

## CLIを使用して作成する

```bash
npx create-next-app@latest
```
これはさっきと基本は同じだね。  
`my-app --yes`オプションを入れたけど、これはプロジェクト名の指定と `--yes`オプションで全部入れているだけ。  

この辺はやったのでOK

## 手動インストール

まあこれはスキップでいいでしょう。  
恐らくカスタムインストールのことだね。  

## 開発サーバーを実行する

```bash
# プロジェクトに移動
cd my-app/ 

# 開発サーバの起動
npm run dev
```

で、<http://localhost:3000> にアクセスすればOK  

`app/page.tsx` を編集すれば、最初のページが編集できる…と。  


## TypeScript をセットアップする

これはやっているのでスキップ  

## リンティングを設定する

これもOKだね。  
以下だけ追加しておわり。  

```json
    "lint:fix": "eslint --fix"
```

## 絶対インポートとモジュールパスエイリアスを設定する

`@`が使えるようになるやつだね。  
※viteの機能だったと思う。  


```js
// Before
import { Button } from '../../../components/button'
 
// After
import { Button } from '@/components/button'
```

以下を設定すればよいと。  

```json
{
  "compilerOptions": {
    "baseUrl": "src/"
  }
}
```


