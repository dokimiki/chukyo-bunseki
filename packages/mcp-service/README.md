# MCP Service

Manaboポータルのスクリーンショット取得やDOM解析を行うExpressベースのサービスです。Model Context Protocol (MCP) によるページ解析ツールも提供します。

## 機能

- **スクリーンショット取得**: `GET /screenshot?url=<URL>` でページ全体のPNG画像を返却
- **DOM取得**: `GET /dom?url=<URL>` でHTMLをgzip圧縮して返却
- **ネットワークログ**: `GET /network?url=<URL>` でXHRメタ情報をJSON形式で取得
- **ページ解析**: `GET /analyze?url=<URL>&screenshot=true&dom=true` でAI向け構造情報を取得
- **MCPサーバー**: `bun dev:mcp` で起動。`analyze_manabo_page` ツールを提供

## 使い方

```bash
# 依存インストール
bun install

# Expressサーバー起動 (デフォルト: http://localhost:3000)
bun run dev

# MCPサーバー起動
bun run dev:mcp
```

## 環境変数

`.env` またはシェルで次を設定します。

| 変数      | 説明                              | 既定値 |
| --------- | --------------------------------- | ------ |
| `MCP_PORT`| Expressサーバーのポート番号       | `3000` |

## 例

```bash
# スクリーンショット取得
curl "http://localhost:3000/screenshot?url=https://manabo.cnc.chukyo-u.ac.jp"

# DOM取得
curl "http://localhost:3000/dom?url=https://manabo.cnc.chukyo-u.ac.jp" -H "Accept-Encoding: gzip" > page.html.gz

# MCPツールでページ解析 (stdio)
bun run dev:mcp | grep "Manabo MCP Server started"
```

ライセンス: Private - 中京大学内部使用のみ
