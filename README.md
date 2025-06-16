`# Chukyo Portal Wrapper 🏫✨

中京大学の
* **Manabo**（授業・課題・成績・出席管理）
* **ALBO**（各種申請／m.mail／お知らせ）

をまとめて扱える "開発者向けラッパー" を **Bun + TypeScript + Playwright** で実装するモノレポです。
CLI／MCP（Model-Context-Protocol）サービス／Gemini 要件定義エージェントを同梱し、
スクリーンショット・DOM・ネットワークログを AI で解析できます。

## 🆕 新機能: Requirements Agent

**mcp-serviceを呼び出すrequirements-agent**を追加しました！

- **MCP統合**: Model Context Protocol経由でManaboページ構造を詳細分析
- **AI要件生成**: Google Gemini AIによる包括的な要件文書の自動生成
- **バッチ処理**: 複数ページの一括分析
- **CLI統合**: `chukyo-cli analyze`コマンドで簡単実行

```bash
# Manaboページの要件分析
export GOOGLE_AI_API_KEY=your_api_key
bun run chukyo-cli analyze --url "https://manabo.cnc.chukyo-u.ac.jp" --output requirements.md
```

---# Chukyo Portal Wrapper 🏫✨

中京大学の
* **Manabo**（授業・課題・成績・出席管理）
* **ALBO**（各種申請／m.mail／お知らせ）

をまとめて扱える “開発者向けラッパー” を **Bun + TypeScript + Playwright** で実装するモノレポです。
CLI／MCP（Model-Context-Protocol）サービス／Gemini 要件定義エージェントを同梱し、
スクリーンショット・DOM・ネットワークログを AI で解析できます。

---

## 📁 ディレクトリ構成（抜粋）

```

my-portal/
├─ .github/instructions/       # Copilot 用カスタム命令
├─ packages/
│   ├─ playwright-worker/      # ログイン＆クローラー
│   ├─ mcp-service/            # Express + Playwright API
│   ├─ cli/                    # cmd-ts 製 CLI
│   └─ requirements-agent/     # Gemini で Markdown 要件定義
└─ bunfig.toml / tsconfig.base.json

```

> **Playwright** のブラウザ実行は `packages/playwright-worker` 直下で行います。
> Cookie などの状態は `storageState.json` に保存され、切れたら自動で再ログインします。

---

## ⚙️ 前提ソフトウェア

| ツール                  | バージョン            | 用途                           |
| ----------------------- | --------------------- | ------------------------------ |
| **Bun**                 | 1.1 以降              | ランタイム・ワークスペース管理 |
| Git                     | 任意                  | バージョン管理                 |
| Chromium/Firefox/WebKit | Playwright が自動取得 | ヘッドレスブラウザ             |

---

## 🚀 クイックスタート

```bash
# 1. クローン
git clone https://github.com/your-name/my-portal.git
cd my-portal

# 2. 依存インストール（全ワークスペース一括）
bun install      # bun.lockb が生成されます

# 3. Playwright のブラウザバイナリ取得
bunx playwright install

# 4. .env を用意
cp .env.example .env
#   ├─ CU_ID=学籍番号
#   ├─ CU_PASS=パスワード
#   └─ GEMINI_API_KEY=Google AI Studio で取得

# 5. 動作確認（ログイン → 時間割ページを PDF へ）
bun run packages/playwright-worker/src/login.ts
bun run packages/playwright-worker/src/manaboCrawler.ts timetable
````

---

## 🛠️ よく使うコマンド

| コマンド                                                           | 説明                                   |
| ------------------------------------------------------------------ | -------------------------------------- |
| `bun run dev`                                                      | すべてのパッケージをホットリロード起動 |
| `bun run --filter ./packages/* build`                              | 全パッケージをビルド                   |
| `bun test --coverage`                                              | ワークスペース横断ユニットテスト       |
| `bun run packages/cli gen-spec --target manabo --page assignments` | LLM で課題ページの Markdown 仕様書生成 |
| `curl http://localhost:8787/screenshot`                            | MCP 経由で最新スクリーンショット取得   |

---

## 🔑 環境変数

| 変数             | 説明                                | 必須 |
| ---------------- | ----------------------------------- | ---- |
| `CU_ID`          | 学籍番号                            | ✅    |
| `CU_PASS`        | ポータルパスワード                  | ✅    |
| `GEMINI_API_KEY` | Google Gemini 用 API キー           | ✅    |
| `DEBUG`          | `playwright:*` を指定すると詳細ログ | 任意 |

`.env` は **絶対にコミットしない**でください。`git secret` や 1Password CLI の利用を推奨します。

---

## 📝 開発フロー

1. **issue** / **PR** を立て、対応パッケージをラベル付け
2. ローカルで `bun run dev` → Copilot Chat に実装を依頼
3. テスト (`bun test`) が緑になることを確認
4. `git commit -m "feat(worker): 〇〇を実装"`
5. `git push` → GitHub Actions で CI / Playwright ヘッドレステスト
6. レビュー後 `main` マージし、自動デプロイ（任意で Fly.io など）

> Copilot が生成したコードは **AGENT.md** と `.github/instructions/` に沿うようになっています。必ず型エラーと ESLint ワーニングが無いことを確認してください。

---

## 🛡️ セキュリティとコンプライアンス

* 大学より**開発許可**取得済み。
* 学籍情報や成績など **個人情報** を API（Gemini 等）へ渡す際は暗号化フィールドを利用。
* アクセスは「本人利用」かつ **リクエスト間隔を 5 秒以上** として大学側サーバ負荷を避ける設計です。
* Playwright の `trace.zip` には Cookie が含まれる可能性があるため、外部公開しないこと。
