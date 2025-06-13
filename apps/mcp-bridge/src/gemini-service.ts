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

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("❌ Gemini API error:", error);
      throw new Error(`Failed to generate report: ${(error as Error).message}`);
    }
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
