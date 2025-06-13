import WebSocket from "ws";
import { MCPCommand } from "@chukyo-bunseki/shared";

export class MCPClient {
  private playwrightWs: WebSocket | null = null;
  private puppeteerWs: WebSocket | null = null;
  private sessionId = "student-portal";

  async connect() {
    console.log("🔌 Connecting to MCP servers...");

    try {
      // Playwright MCP接続
      this.playwrightWs = new WebSocket(
        `ws://localhost:${process.env.MCP_PLAYWRIGHT_PORT || 5001}`
      );
      await this.waitForConnection(this.playwrightWs);
      console.log("✅ Connected to Playwright MCP");
    } catch (error) {
      console.warn("⚠️ Playwright MCP connection failed, trying Puppeteer...");

      try {
        // Puppeteer MCP フォールバック
        this.puppeteerWs = new WebSocket(
          `ws://localhost:${process.env.MCP_PUPPETEER_PORT || 5002}`
        );
        await this.waitForConnection(this.puppeteerWs);
        console.log("✅ Connected to Puppeteer MCP (fallback)");
      } catch (fallbackError) {
        throw new Error("Both Playwright and Puppeteer MCP connections failed");
      }
    }
  }

  private waitForConnection(ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      ws.onerror = error => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  async exploreSite(data: any) {
    const activeWs = this.playwrightWs || this.puppeteerWs;
    if (!activeWs) {
      throw new Error("No MCP connection available");
    }

    console.log("🌐 Starting site exploration...");

    const explorationResults = {
      sitemap: "",
      apiEndpoints: [] as any[],
      domStructure: [] as { page: any; elements: any }[],
      authFlow: { type: "form" as const, steps: [] },
    };

    // 1. ログイン
    await this.sendMCPCommand({
      id: "login",
      method: "navigate",
      params: {
        url: data.siteUrl,
        sessionId: this.sessionId,
      },
    });

    // 2. ログインフォーム探索
    const loginForm = await this.sendMCPCommand({
      id: "find-login",
      method: "query_selector_all",
      params: {
        selector: 'form, input[type="password"], [role="login"]',
        sessionId: this.sessionId,
      },
    });

    // 3. 認証情報入力（実装はここでダミー）
    if (data.credentials) {
      console.log("🔐 Attempting login...");
      // 実際のログイン処理は省略（デモ用）
    }

    // 4. ページ構造スナップショット
    const snapshot = await this.sendMCPCommand({
      id: "snapshot",
      method: "accessibility_snapshot",
      params: {
        sessionId: this.sessionId,
      },
    });

    // 5. ネットワークログ取得
    const networkLogs = await this.sendMCPCommand({
      id: "network",
      method: "get_network_logs",
      params: {
        sessionId: this.sessionId,
      },
    });

    explorationResults.domStructure.push({
      page: data.siteUrl,
      elements: snapshot?.result?.elements || [],
    });

    explorationResults.apiEndpoints = networkLogs?.result?.requests || [];

    return explorationResults;
  }

  private async sendMCPCommand(command: MCPCommand): Promise<any> {
    const activeWs = this.playwrightWs || this.puppeteerWs;
    if (!activeWs) {
      throw new Error("No MCP connection available");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`MCP command timeout: ${command.method}`));
      }, 30000);

      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === command.id) {
            clearTimeout(timeout);
            activeWs.off("message", messageHandler);
            resolve(response);
          }
        } catch (error) {
          // Ignore parsing errors for other messages
        }
      };

      activeWs.on("message", messageHandler);
      activeWs.send(JSON.stringify(command));
    });
  }

  disconnect() {
    this.playwrightWs?.close();
    this.puppeteerWs?.close();
    console.log("🔌 Disconnected from MCP servers");
  }
}
