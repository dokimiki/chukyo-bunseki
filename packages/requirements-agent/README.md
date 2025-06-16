# Requirements Agent

mcp-serviceを呼び出してManaboページの分析を行い、要件文書を生成するエージェントです。

## 特徴

- **MCP統合**: Model Context Protocol (MCP) サービスを利用してManaboページの構造解析
- **AI生成**: Google Gemini AIを使用した包括的な要件文書の自動生成
- **キャッシング**: 24時間のキャッシュ機能で効率的な分析
- **バッチ処理**: 複数URLの一括分析サポート

## 依存関係

```json
{
  "@chukyo-bunseki/mcp-service": "workspace:*",
  "@google/generative-ai": "^0.1.3",
  "@modelcontextprotocol/sdk": "^1.12.3"
}
```

## 環境変数

```bash
export GOOGLE_AI_API_KEY=your_gemini_api_key
```

## 使用方法

### 基本的な使用

```typescript
import { generateRequirements } from "@chukyo-bunseki/requirements-agent";

const result = await generateRequirements({
  screenUrl: "https://manabo.cnc.chukyo-u.ac.jp"
});

console.log(result.markdown); // 生成された要件文書
console.log(result.manaboAnalysis); // MCPサービスからの詳細分析
```

### バッチ処理

```typescript
import { generateBatchRequirements } from "@chukyo-bunseki/requirements-agent";

const urls = [
  "https://manabo.cnc.chukyo-u.ac.jp",
  "https://manabo.cnc.chukyo-u.ac.jp/course",
  "https://manabo.cnc.chukyo-u.ac.jp/assignment"
];

const results = await generateBatchRequirements(urls);
results.forEach(result => {
  if (result.error) {
    console.error(`Error for ${result.url}: ${result.error}`);
  } else {
    console.log(`Requirements for ${result.url}:`, result.requirements.markdown);
  }
});
```

### キャッシュ利用

```typescript
import { requirementsCache } from "@chukyo-bunseki/requirements-agent";

const input = { screenUrl: "https://manabo.cnc.chukyo-u.ac.jp" };

// キャッシュを確認
const cached = requirementsCache.get(input);
if (cached) {
  console.log("Using cached result");
} else {
  const result = await generateRequirements(input);
  // 自動的にキャッシュされます
}
```

## CLI使用

### 単一ページ分析

```bash
# コンソール出力
bun run chukyo-cli analyze --url "https://manabo.cnc.chukyo-u.ac.jp"

# ファイル出力
bun run chukyo-cli analyze --url "https://manabo.cnc.chukyo-u.ac.jp" --output requirements.md
```

### バッチ分析

```bash
# 複数URLを標準入力から受け取り
echo -e "https://manabo.cnc.chukyo-u.ac.jp\nhttps://manabo.cnc.chukyo-u.ac.jp/course" | \
  bun run chukyo-cli analyze --batch --output batch-requirements.md
```

## MCP統合詳細

requirements-agentは以下の流れでMCPサービスと連携します：

1. **MCP接続**: `@modelcontextprotocol/sdk`を使用してmcp-serviceに接続
2. **ページ解析**: `analyze_manabo_page`ツールを呼び出してManabo固有の構造解析
3. **AI処理**: 解析結果をGoogle Gemini AIに送信して要件文書生成
4. **結果統合**: MCPの解析データとAI生成の要件文書を組み合わせて返却

### MCP解析データ

```typescript
interface ManaboPageAnalysis {
  url: string;
  title: string;
  pageType: ManaboPageType; // TOP, COURSES, ASSIGNMENTS, etc.
  structure: {
    selectors: Record<string, string>;    // CSS セレクター
    actions: ManaboAction[];              // クリック可能要素
    dataElements: ManaboDataElement[];    // データ抽出対象
    navigation: ManaboNavigation[];       // ナビゲーション要素
  };
  screenshot?: string;  // Base64画像（オプション）
  domContent?: string;  // HTML内容
  timestamp: string;
}
```

## デモ実行

```bash
cd packages/requirements-agent
export GOOGLE_AI_API_KEY=your_api_key
bun run demo.ts
```

## テスト

```bash
bun run test --coverage
```

## ビルド

```bash
bun run build
```

## トラブルシューティング

### MCP接続エラー

- mcp-serviceが起動していることを確認
- 適切なパーミッションでbunが実行されていることを確認

### Gemini APIエラー

- `GOOGLE_AI_API_KEY`環境変数が設定されていることを確認
- APIキーが有効であることを確認
- レート制限に達していないことを確認

### メモリ不足

- 大きなDOMコンテンツは自動的にチャンクされますが、メモリ使用量が多い場合は`maxChunkSize`オプションを調整

## アーキテクチャ

```
Requirements Agent
├── MCP Client (Manabo構造解析)
├── Gemini AI (要件文書生成)
├── Cache Layer (24h TTL)
└── CLI Interface
```

このアーキテクチャにより、Manaboページの詳細な技術分析と人間が読みやすい要件文書の両方を効率的に生成できます。
