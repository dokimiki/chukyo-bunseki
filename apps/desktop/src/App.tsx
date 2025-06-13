import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

interface SiteConfig {
  url: string;
  name: string;
  username: string;
  password: string;
}

interface InvestigationResult {
  success: boolean;
  message: string;
  report?: string;
}

function App() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    url: "https://manabo.cnc.chukyo-u.ac.jp/auth/shibboleth/",
    name: "中京大学manaba",
    username: "",
    password: "",
  });

  const [isInvestigating, setIsInvestigating] = useState(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);

  const handleInvestigate = async () => {
    if (!siteConfig.username || !siteConfig.password) {
      alert("ユーザー名とパスワードを入力してください");
      return;
    }

    setIsInvestigating(true);
    setResult(null);

    try {
      // MCP Bridge起動
      await invoke("start_mcp_bridge");

      // サイト調査実行
      const investigationResult = await invoke<InvestigationResult>(
        "investigate_site",
        {
          config: siteConfig,
        }
      );

      setResult(investigationResult);
    } catch (error) {
      console.error("調査エラー:", error);
      setResult({
        success: false,
        message: `調査に失敗しました: ${error}`,
      });
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Portal Research Agent</h1>
        <p>学生ポータルサイトの技術調査ツール</p>
      </header>

      <main className="app-main">
        <section className="config-section">
          <h2>調査対象サイト設定</h2>
          <div className="form-group">
            <label>サイト名:</label>
            <input
              type="text"
              value={siteConfig.name}
              onChange={e =>
                setSiteConfig({ ...siteConfig, name: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>URL:</label>
            <input
              type="url"
              value={siteConfig.url}
              onChange={e =>
                setSiteConfig({ ...siteConfig, url: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>ユーザー名:</label>
            <input
              type="text"
              value={siteConfig.username}
              onChange={e =>
                setSiteConfig({ ...siteConfig, username: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>パスワード:</label>
            <input
              type="password"
              value={siteConfig.password}
              onChange={e =>
                setSiteConfig({ ...siteConfig, password: e.target.value })
              }
            />
          </div>
          <button
            onClick={handleInvestigate}
            disabled={isInvestigating}
            className="investigate-button"
          >
            {isInvestigating ? "調査中..." : "調査開始"}
          </button>
        </section>

        {result && (
          <section className="results-section">
            <h2>調査結果</h2>
            <div className={`status ${result.success ? "success" : "error"}`}>
              {result.message}
            </div>
            {result.report && (
              <div className="report">
                <h3>生成されたレポート</h3>
                <pre>{result.report}</pre>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>⚠️ 利用規約を遵守し、適切な頻度でご利用ください</p>
      </footer>
    </div>
  );
}

export default App;
