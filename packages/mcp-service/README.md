# MCP Service

Manaboポータルのスクリーンショット取得やDOM解析を行うExpressベースのサービスです。Model Context Protocol (MCP) によるページ解析ツールも提供します。

## 機能

### Express API

- **スクリーンショット取得**: `GET /screenshot?url=<URL>` でページ全体のPNG画像を返却
- **DOM取得**: `GET /dom?url=<URL>` でHTMLをgzip圧縮して返却
- **ネットワークログ**: `GET /network?url=<URL>` でXHRメタ情報をJSON形式で取得
- **ページ解析**: `GET /analyze?url=<URL>&screenshot=true&dom=true` でAI向け構造情報を取得
- **ヘルスチェック**: `GET /health` でサーバー状態確認

### MCP Server

- **analyze_manabo_page**: ページ構造分析とHTMLセレクター情報
- **take_screenshot**: フルページスクリーンショット取得
- **get_page_dom**: HTML DOM内容取得
- **monitor_network**: ネットワークリクエスト監視（XHR/API呼び出し）
- **health_check**: MCPサーバーとブラウザーコンテキストの状態確認

## 使い方

```bash
# 依存インストール
bun install

# Expressサーバー起動 (デフォルト: http://localhost:3000)
bun run dev

# MCPサーバー起動 (stdio transport)
bun run dev:mcp

# デモ実行
bun run demo
```

## 環境変数

`.env` またはシェルで次を設定します。

| 変数       | 説明                        | 既定値 |
| ---------- | --------------------------- | ------ |
| `MCP_PORT` | Expressサーバーのポート番号 | `3000` |

## 例

```bash
# スクリーンショット取得
curl "http://localhost:3000/screenshot?url=https://manabo.cnc.chukyo-u.ac.jp"

# DOM取得
curl "http://localhost:3000/dom?url=https://manabo.cnc.chukyo-u.ac.jp" -H "Accept-Encoding: gzip" > page.html.gz

# MCPツールでページ解析 (stdio)
bun run dev:mcp | grep "Manabo MCP Server started"
```

## MCP使用例

### MCP Client (Claude Desktop, Cline等)

```json
{
  "mcpServers": {
    "manabo-analyzer": {
      "command": "bun",
      "args": ["/path/to/chukyo-bunseki/packages/mcp-service/src/mcp-server.ts"],
      "env": {
        "CHUKYO_USERNAME": "your_username",
        "CHUKYO_PASSWORD": "your_password"
      }
    }
  }
}
```

### 利用可能なツール

1. **analyze_manabo_page**: 総合的なページ解析

   ```typescript
   {
     "url": "https://manabo.cnc.chukyo-u.ac.jp",
     "includeScreenshot": true,
     "includeDOM": true
   }
   ```

2. **take_screenshot**: スクリーンショットのみ

   ```typescript
   {
     "url": "https://manabo.cnc.chukyo-u.ac.jp"
   }
   ```

3. **get_page_dom**: HTML内容のみ

   ```typescript
   {
     "url": "https://manabo.cnc.chukyo-u.ac.jp"
   }
   ```

4. **monitor_network**: ネットワーク監視

   ```typescript
   {
     "url": "https://manabo.cnc.chukyo-u.ac.jp",
     "waitTime": 5000
   }
   ```

5. **health_check**: 状態確認

   ```typescript
   {} // 引数不要
   ```

ライセンス: Private - 中京大学内部使用のみ
