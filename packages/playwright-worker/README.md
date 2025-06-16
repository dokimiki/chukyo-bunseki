# Playwright Worker

中京大学学内ポータルの自動化とテストのためのPlaywrightベースのワーカーパッケージです。

## 機能

- **認証**: Shibboleth認証によるログイン
- **自動化**: ページナビゲーション、フォーム入力、要素操作
- **ポータル操作**: 履修登録、成績確認、シラバス検索、お知らせ確認
- **要件分析**: requirements-agentとの統合による自動要件文書生成

## インストール

```bash
bun install
```

## 環境変数

```bash
# 中京大学ポータルのログイン情報
CHUKYO_USERNAME=your_student_id
CHUKYO_PASSWORD=your_password

# 要件分析用（オプション）
GOOGLE_AI_API_KEY=your_gemini_api_key
# Playwright 設定
HEADLESS=true
```

## 使用方法

### 基本的なログイン

```typescript
import { loginToChukyo } from "@chukyo-bunseki/playwright-worker";

const result = await loginToChukyo({
    username: "your_student_id",
    password: "your_password",
    headless: true, // ヘッドレスモード
    timeout: 30000, // タイムアウト（ミリ秒）
});

if (result.success) {
    console.log("ログイン成功");
    console.log("セッション保存先:", result.stateFile);
} else {
    console.log("ログイン失敗:", result.message);
}
```

### 自動化ワーカー

```typescript
import { createAutomationWorker } from "@chukyo-bunseki/playwright-worker";

const worker = await createAutomationWorker({
    stateFile: "state.json", // ログインで保存されたセッション
    headless: false,
    slowMo: 500, // 操作間隔（ミリ秒）
});

// ページに移動
await worker.navigateTo("https://manabo.cnc.chukyo-u.ac.jp");

// 要素をクリック
await worker.click('a[href*="course"]');

// フォームに入力
await worker.fill('input[name="keyword"]', "数学");

// 要素の存在確認
const exists = await worker.elementExists('.search-results');

// ページ情報を取得
const pageInfo = await worker.getPageInfo();

// クリーンアップ
await worker.cleanup();
```

### ポータル専用ワーカー

```typescript
import { createPortalWorker } from "@chukyo-bunseki/playwright-worker";

const worker = await createPortalWorker({
    stateFile: "state.json",
});

// 学生情報を取得
const studentInfo = await worker.getStudentInfo();
console.log("学生情報:", studentInfo);

// 履修科目を取得
const courses = await worker.getRegisteredCourses();
console.log("履修科目:", courses);

// 成績を取得
const grades = await worker.getGrades();
console.log("成績:", grades);

// お知らせを取得
const announcements = await worker.getAnnouncements();
console.log("お知らせ:", announcements);

// 科目を検索
const searchResults = await worker.searchCourses("プログラミング");
console.log("検索結果:", searchResults);

// 科目を履修登録
await worker.registerCourse("CS101");

// 科目を履修取消
await worker.dropCourse("CS101");

await worker.cleanup();
```

### 統合ワーカー（要件分析付き）

```typescript
import { createIntegrationWorker } from "@chukyo-bunseki/playwright-worker";

const worker = await createIntegrationWorker({
    stateFile: "state.json",
    geminiApiKey: "your_api_key",
});

// ページに移動して要件分析
const analysis = await worker.navigateAndAnalyze("https://manabo.cnc.chukyo-u.ac.jp");

if (analysis.success) {
    console.log("URL:", analysis.pageInfo.url);
    console.log("タイトル:", analysis.pageInfo.title);
    console.log("要件文書:", analysis.requirements);
}

// 各ページの分析
const portalAnalysis = await worker.analyzeCompletePortal();
console.log("トップページ分析:", portalAnalysis.top.requirements);
console.log("履修登録分析:", portalAnalysis.courses.requirements);

await worker.cleanup();
```

## API リファレンス

### LoginOptions

```typescript
interface LoginOptions {
    username: string;        // 学生ID
    password: string;        // パスワード
    headless?: boolean;      // ヘッドレスモード（デフォルト: true）
    slowMo?: number;         // 操作間隔（デフォルト: 100ms）
    timeout?: number;        // タイムアウト（デフォルト: 30000ms）
}
```

### AutomationOptions

```typescript
interface AutomationOptions {
    stateFile?: string;      // セッションファイル（デフォルト: "state.json"）
    headless?: boolean;      // ヘッドレスモード
    slowMo?: number;         // 操作間隔
    timeout?: number;        // タイムアウト
}
```

### PageInfo

```typescript
interface PageInfo {
    url: string;             // ページURL
    title: string;           // ページタイトル
    domContent: string;      // HTML内容
    networkLogs: any[];      // ネットワークログ
    screenshot?: string;     // スクリーンショット（Base64）
}
```

### StudentInfo

```typescript
interface StudentInfo {
    studentId: string;       // 学生ID
    name: string;            // 氏名
    department: string;      // 学部・学科
    grade: string;           // 学年
}
```

### CourseInfo

```typescript
interface CourseInfo {
    courseId: string;        // 科目ID
    courseName: string;      // 科目名
    instructor: string;      // 担当教員
    credits: number;         // 単位数
    schedule: string;        // 時間割
    status: string;          // 状態
}
```

## テスト

```bash
# テスト実行
bun test

# カバレッジ付きテスト
bun test --coverage
```

## デモ

```bash
# デモ実行（環境変数設定が必要）
CHUKYO_USERNAME=your_id CHUKYO_PASSWORD=your_pass bun demo.ts
```

## 注意事項

- このパッケージは教育・研究目的で作成されています
- 実際の使用時は大学のシステム利用規約を遵守してください
- 過度なアクセスによりサーバーに負荷をかけないよう注意してください
- セッションファイル（state.json）は機密情報を含むため適切に管理してください

## トラブルシューティング

### ログインに失敗する

1. 認証情報が正しいか確認
2. 大学のシステムがメンテナンス中でないか確認
3. ネットワーク接続を確認

### 要素が見つからない

1. ページの読み込み完了を待つ
2. セレクターが正しいか確認
3. サイトの構造が変更されていないか確認

### セッションが無効

1. 再度ログインを実行
2. state.jsonファイルを削除して再生成

## ライセンス

Private - 中京大学内部使用のみ
