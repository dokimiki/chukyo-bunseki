## 概要 / Scope

* **目的**: Chukyo Manabo・Chukyo ALBO へ Playwright でログインし、MCP Service 経由でスクリーンショット・DOM・XHR ログを取得する開発用ツール群（monorepo）。
* **役割**: Copilot Chat は *補助的なペアプロ* として働き、雛形生成・型補完・ユニットテスト作成・リファクタ提案を担当する。手動レビューと CI を必須とする。

---

## 1️⃣ コーディング方針

| 項目       | 指針                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| ランタイム | **Bun v1.1+**。Playwright 互換差分があるため Issue #27139 の回避策を確認してから提案すること。                  |
| モジュール | ESM 固定、`type":"module"` を各 `package.json` に設定。                                                         |
| 型         | TypeScript *strict*。Copilot 生成コードは必ず型エラー 0 を達成。                                                |
| CLI        | `cmd-ts` を既定のパーサとし、サブコマンド DSL を活用。                                                          |
| スタイル   | 2 space indent・single quotes。Airbnb ルール＋ESLint header `/* eslint-disable functional/no-class */` を追加。 |
| Playwright | `context.tracing.start({ screenshots:true, snapshots:true })` をデフォルトで有効化し `trace.zip` を保存。       |
| テスト     | Copilot は `bun test --coverage` が 100 % 通過するテスト雛形を生成。                                            |

---

## 2️⃣ ファイル／API 生成ガイド

### 2.1 Playwright Worker

1. **`src/login.ts`**

   * Shibboleth 画面で `#username`, `#password` を入力し、`waitForNavigation(/manabo\.cnc/)` までを１関数に。
   * 成功後 `context.storageState({ path:'state.json' })`。

2. **`src/manaboCrawler.ts` / `alboCrawler.ts`**

   * `page.route('**/api/**')` で XHR を収集して返却。
   * `await page.content()` を gzip 圧縮して返却。

### 2.2 MCP Service (Express)

| エンドポイント    | 支援内容                             |
| ----------------- | ------------------------------------ |
| `GET /screenshot` | `page.screenshot({ fullPage:true })` |
| `GET /dom`        | 圧縮 HTML                            |
| `GET /network`    | XHR メタ JSON                        |

Copilot はルーティングと型定義 (`@types/express`) を自動挿入し、エラー処理を `try/catch` + 1 リトライで実装する。

### 2.3 Gemini 要件定義エージェント

* `@google-ai/generative` SDK を使用し、**JSON mode** で `{ markdown: string }` を返す。
* 入力 > 200 KB のとき DOM をチャンク分割する実装を推奨。
* 生成 Markdown には `### 画面名` 見出しと主要セレクタ表を含める。

---

## 3️⃣ Copilot Chat へのプロンプト作法

1. **機能指示は箇条書きで短く**

   > 「Playwright で `/timetable` に遷移し、スクショと DOM を保存するユーティリティ関数を作成して」
2. **入力データを必ず先頭コメントで指定**（例: URL, 期待出力）。Codex はコメント＝契約とみなす。
3. **テスト追加を明示**

   > 「Edge case 含むユニットテストを `__tests__/login.test.ts` に生成」

---

## 4️⃣ セキュリティ & 倫理

* ポータル許可済みでも、**学籍番号・パスワードは絶対コードに直書きしない**。 `.env` を介する。
* Copilot が生成したコードに含まれる第三者コード片のライセンスを必ずレビューする。「Responsible use」ガイドに従い、セキュリティ欠陥を警戒。

---

## 5️⃣ 参考情報（Copilot が参照すべき外部ドキュメント）

* GitHub **copilot-instructions.md** 公式ドキュメント。
* Medium「Mastering Copilot Custom Instructions」。
* VS Code 公式「Agent Mode」。
* Bun Workspaces Docs。
* Playwright-Bun 互換 Issue #2492 / #27139。
* Wired 記事「Copilot の長所と欠点」。

---

## 6️⃣ 例: Copilot への良い質問

> **Q:** 「`requirements-agent` に、URL と DOM ハッシュで 24 h キャッシュするユーティリティを追加して」
> **期待:** `packages/requirements-agent/src/cache.ts` が作成され、LRU + Bun KV 実装、ユニットテスト付き。
