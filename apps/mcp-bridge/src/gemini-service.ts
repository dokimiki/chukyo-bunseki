import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  async generateReport(explorationData: any): Promise<string> {
    console.log("🤖 Generating report with Gemini...");

    const prompt = this.buildPrompt(explorationData);
    console.log("📝 Prompt prepared, calling Gemini API...");

    try {
      // タイムアウト処理を追加
      const timeout = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Gemini API timeout after 60 seconds")),
          60000
        );
      });

      const apiCall = this.model.generateContent(prompt);

      console.log("⏳ Waiting for Gemini response...");
      const result = await Promise.race([apiCall, timeout]);

      console.log("📨 Received response from Gemini, extracting text...");
      const response = await result.response;
      const reportText = response.text();

      console.log("✅ Report generated successfully");
      console.log(`📊 Report length: ${reportText.length} characters`);

      return reportText;
    } catch (error) {
      console.error("❌ Gemini API error:", error);
      console.error("❌ Error details:", (error as Error).stack);

      // フォールバック用の基本レポートを生成
      console.log("🔄 Generating fallback report...");
      return this.generateFallbackReport(explorationData);
    }
  }

  private generateFallbackReport(explorationData: any): string {
    console.log("📋 Creating fallback report...");

    return `# 調査レポート (簡易版)

## 概要
サイト調査が完了しましたが、AI分析で問題が発生したため、基本的な情報のみを表示します。

## 調査結果

### サイト情報
- URL: ${explorationData.domStructure?.[0]?.page || "不明"}
- ログイン成功: ${explorationData.loginSuccess ? "はい" : "いいえ"}
- 取得したスクリーンショット数: ${explorationData.screenshots?.length || 0}

### 発見されたフォーム
${explorationData.domStructure?.[0]?.elements?.filter((e: any) => e.type === "form").length || 0}個のフォームが見つかりました。

### APIエンドポイント
${explorationData.apiEndpoints?.length || 0}個のAPIエンドポイントが検出されました。

### エラー情報
${explorationData.errorLogs?.length > 0 ? explorationData.errorLogs.join("\n- ") : "エラーなし"}

## 注意
これは簡易版のレポートです。詳細な分析については、Gemini APIの設定を確認してください。
`;
  }

  private buildPrompt(data: any): string {
    return `
SYSTEM:
You are PortalResearchAgent. Your goal is to reverse-engineer a university
student portal to enable future automation.

EXPLORATION DATA:
${JSON.stringify(data, null, 2)}

TASKS:
1. Analyze the provided DOM structure and network requests
2. Identify authentication flow (cookie, SSO, MFA)
3. Map out page hierarchy and navigation patterns
4. Extract API endpoints and their purposes
5. Generate actionable automation recommendations

OUTPUT FORMAT:
Generate a comprehensive Japanese Markdown report with the following sections:

# 学生ポータル技術調査レポート

## 概要
- サイト名と基本情報
- 調査日時と対象URL

## 画面構成
### 発見されたページ一覧
- URL
- 目的・機能
- アクセス方法

## 認証システム
### 認証方式
- ログイン方法（フォーム/SSO/MFA）
- セッション管理
- セキュリティ機能

## DOM構造分析
### 主要要素
- 重要なフォーム要素
- ナビゲーション構造
- データ表示エリア

### 自動化用セレクタ
\`\`\`css
/* 推奨CSSセレクタ例 */
\`\`\`

## API エンドポイント
### 発見されたAPI
- エンドポイント URL
- HTTP メソッド
- パラメータ例
- レスポンス形式

## 自動化実装案
### 推奨アプローチ
1. ログイン自動化手順
2. データ取得方法
3. エラーハンドリング

### 注意事項
- レート制限への配慮
- セッション管理
- 利用規約の遵守

## 法的・倫理的考慮事項
- 利用規約の要点
- スクレイピング許可の有無
- 推奨される利用頻度

## 技術的制約
- 対応ブラウザ
- JavaScriptの必要性
- CAPTCHAの有無

## 今後のTODO
- [ ] 追加調査が必要な機能
- [ ] 実装すべき機能優先度
- [ ] テスト環境の構築

---
*このレポートは自動生成されました。実装前に利用規約を必ず確認してください。*
`;
  }
}
