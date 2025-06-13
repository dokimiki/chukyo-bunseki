import { chromium, firefox, Browser, Page } from "playwright";
import { MCPCommand } from "@chukyo-bunseki/shared";

export class MCPClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private sessionId = "student-portal";
  private mockMode = false; // フォールバックモード

  async connect() {
    console.log("🔌 Starting Playwright browser...");

    // まずChromiumを試す
    try {
      console.log("🔧 Launching chromium...");
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-extensions",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-default-apps",
          "--disable-translate",
          "--disable-sync",
          "--single-process", // Windows用の安定化オプション
        ],
        timeout: 10000, // 10秒に短縮
      });

      console.log("🔧 Creating new page...");
      this.page = await this.browser.newPage();

      // ユーザーエージェントを設定
      console.log("🔧 Setting viewport...");
      await this.page.setViewportSize({ width: 1280, height: 720 });

      // ページのタイムアウト設定
      this.page.setDefaultTimeout(15000);
      this.page.setDefaultNavigationTimeout(15000);

      console.log("✅ Chromium browser started successfully");
      return;
    } catch (chromiumError) {
      console.warn("⚠️ Chromium launch failed, trying Firefox...", chromiumError);
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    }

    // Chromiumが失敗した場合、Firefoxを試す
    try {
      console.log("🔧 Launching Firefox...");
      this.browser = await firefox.launch({
        headless: true,
        timeout: 10000,
      });

      console.log("🔧 Creating new page...");
      this.page = await this.browser.newPage();

      console.log("🔧 Setting viewport...");
      await this.page.setViewportSize({ width: 1280, height: 720 });

      this.page.setDefaultTimeout(15000);
      this.page.setDefaultNavigationTimeout(15000);

      console.log("✅ Firefox browser started successfully");
      return;
    } catch (firefoxError) {
      console.error("❌ Firefox launch also failed:", firefoxError);
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    }

    // すべてのブラウザが失敗した場合
    console.warn("⚠️ All browsers failed to start, enabling mock mode");
    this.mockMode = true;
    console.log("✅ Mock mode enabled - continuing without browser");
  }

  async exploreSite(data: any) {
    // モックモードの場合はモックデータを返す
    if (this.mockMode) {
      console.log("🔄 Running in mock mode...");
      return await this.createMockExplorationData(data);
    }

    if (!this.page) {
      throw new Error("Browser not initialized. Call connect() first.");
    }

    console.log("🌐 Starting site exploration...");

    const explorationResults = {
      sitemap: "",
      apiEndpoints: [] as any[],
      domStructure: [] as { page: any; elements: any }[],
      authFlow: { type: "form" as const, steps: [] },
      loginSuccess: false,
      pageContent: "",
      screenshots: [] as string[],
      errorLogs: [] as string[],
    };

    try {
      // ネットワークリクエストをキャプチャ
      const requests: any[] = [];
      this.page.on("request", request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          headers: request.headers(),
        });
      });

      // コンソールエラーをキャプチャ
      this.page.on("console", msg => {
        if (msg.type() === "error") {
          explorationResults.errorLogs.push(msg.text());
        }
      });

      // 1. ログインページに移動
      console.log("📍 Navigating to:", data.siteUrl);

      try {
        await this.page.goto(data.siteUrl, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        console.log("✅ Successfully navigated to site");
      } catch (navigationError) {
        console.error("❌ Navigation failed:", navigationError);
        explorationResults.errorLogs.push(
          `Navigation failed: ${navigationError}`
        );
        throw navigationError;
      }

      // ページのスクリーンショットを取得
      console.log("📸 Taking initial screenshot...");
      try {
        const screenshotBuffer = await this.page.screenshot();
        const screenshot = screenshotBuffer.toString("base64");
        explorationResults.screenshots.push(screenshot);
        console.log("✅ Initial screenshot captured");
      } catch (screenshotError) {
        console.error("❌ Screenshot failed:", screenshotError);
        explorationResults.errorLogs.push(
          `Screenshot failed: ${screenshotError}`
        );
      }

      // 2. ログインフォームを探す
      console.log("🔍 Looking for login forms...");
      try {
        const loginForms = await this.page.$$("form");
        console.log(`Found ${loginForms.length} forms on the page`);

        const usernameInput = await this.page.$(
          'input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[id*="user"], input[id*="login"], input[name*="User"], input[name*="Login"], input[id*="User"], input[id*="Login"]'
        );
        const passwordInput = await this.page.$('input[type="password"]');

        console.log(`Username input found: ${!!usernameInput}`);
        console.log(`Password input found: ${!!passwordInput}`);

        if (usernameInput && passwordInput) {
          console.log("🔐 Login form found, attempting login...");

          // ログイン情報を入力
          console.log("⌨️ Filling username...");
          await usernameInput.fill(data.username || "");

          console.log("⌨️ Filling password...");
          await passwordInput.fill(data.password || "");

          // ログインボタンを探してクリック
          console.log("🔍 Looking for submit button...");
          const submitButton = await this.page.$(
            'input[type="submit"], button[type="submit"], button:has-text("ログイン"), button:has-text("Login"), button:has-text("サインイン")'
          );

          if (submitButton) {
            console.log("🔐 Clicking login button...");
            await submitButton.click();

            // ログイン後のページロードを待つ
            console.log("⏳ Waiting for navigation after login...");
            try {
              await this.page.waitForLoadState("networkidle", {
                timeout: 30000,
              });
              console.log("✅ Page loaded after login");
            } catch (timeoutError) {
              console.warn("⚠️ Timeout waiting for navigation, continuing...");
              explorationResults.errorLogs.push(
                `Navigation timeout: ${timeoutError}`
              );
            }
            // ログイン成功の判定
            const currentUrl = this.page.url();
            if (currentUrl !== data.siteUrl) {
              explorationResults.loginSuccess = true;
              console.log(
                "✅ Login appears successful, redirected to:",
                currentUrl
              );

              // ログイン後のスクリーンショット
              console.log("📸 Taking post-login screenshot...");
              try {
                const postLoginScreenshotBuffer = await this.page.screenshot();
                const postLoginScreenshot =
                  postLoginScreenshotBuffer.toString("base64");
                explorationResults.screenshots.push(postLoginScreenshot);
                console.log("✅ Post-login screenshot captured");
              } catch (screenshotError) {
                console.error(
                  "❌ Post-login screenshot failed:",
                  screenshotError
                );
                explorationResults.errorLogs.push(
                  `Post-login screenshot failed: ${screenshotError}`
                );
              }
            } else {
              console.log("❌ Login may have failed - no redirect detected");
            }
          } else {
            console.log("❌ No submit button found");
          }
        } else {
          console.log("❌ Login form not found or incomplete");
        }
      } catch (loginError) {
        console.error("❌ Error during login process:", loginError);
        explorationResults.errorLogs.push(`Login error: ${loginError}`);
      }

      // 3. ページ構造をキャプチャ
      console.log("🏗️ Analyzing page structure...");
      try {
        const domStructure = await this.page.evaluate(() => {
          const elements: any[] = [];

          // フォーム要素
          document.querySelectorAll("form").forEach((form, index) => {
            elements.push({
              type: "form",
              index,
              action: form.getAttribute("action"),
              method: form.getAttribute("method"),
              inputs: Array.from(form.querySelectorAll("input")).map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
              })),
            });
          });

          // リンク
          document.querySelectorAll("a[href]").forEach((link, index) => {
            if (index < 20) {
              // 最初の20個のリンクのみ
              elements.push({
                type: "link",
                href: link.getAttribute("href"),
                text: link.textContent?.substring(0, 100),
              });
            }
          });

          return elements;
        });

        explorationResults.domStructure.push({
          page: this.page.url(),
          elements: domStructure,
        });
        console.log("✅ Page structure analyzed");
      } catch (structureError) {
        console.error("❌ Error analyzing page structure:", structureError);
        explorationResults.errorLogs.push(
          `Structure analysis error: ${structureError}`
        );
      }

      // 4. APIエンドポイントを整理
      console.log("🔗 Processing API endpoints...");
      explorationResults.apiEndpoints = requests.filter(
        req =>
          req.resourceType === "xhr" ||
          req.resourceType === "fetch" ||
          req.url.includes("/api/") ||
          req.url.includes(".json")
      );
      console.log(
        `Found ${explorationResults.apiEndpoints.length} API endpoints`
      );

      // 5. ページコンテンツを取得
      console.log("📄 Extracting page content...");
      try {
        explorationResults.pageContent =
          (await this.page.textContent("body")) || "";
        console.log("✅ Page content extracted");
      } catch (contentError) {
        console.error("❌ Error extracting page content:", contentError);
        explorationResults.errorLogs.push(
          `Content extraction error: ${contentError}`
        );
      }

      console.log("🎯 Site exploration completed successfully");
    } catch (error) {
      console.error("❌ Critical error during site exploration:", error);
      explorationResults.errorLogs.push(`Critical exploration error: ${error}`);

      // ブラウザの状態を確認
      if (this.page) {
        try {
          console.log("📊 Current page URL:", this.page.url());
        } catch (urlError) {
          console.error("❌ Could not get page URL:", urlError);
        }
      }
    }

    return explorationResults;
  }

  private async createMockExplorationData(data: any) {
    console.log("🔄 Creating mock exploration data...");

    return {
      sitemap: "Mock sitemap due to browser startup failure",
      apiEndpoints: [
        {
          url: data.siteUrl,
          method: "GET",
          resourceType: "document",
          headers: { "user-agent": "mock-agent" },
        },
      ],
      domStructure: [
        {
          page: data.siteUrl,
          elements: [
            {
              type: "form",
              index: 0,
              action: "/auth/login",
              method: "POST",
              inputs: [
                {
                  type: "text",
                  name: "username",
                  id: "username",
                  placeholder: "ユーザー名",
                },
                {
                  type: "password",
                  name: "password",
                  id: "password",
                  placeholder: "パスワード",
                },
              ],
            },
          ],
        },
      ],
      authFlow: {
        type: "form" as const,
        steps: ["username", "password", "submit"],
      },
      loginSuccess: false,
      pageContent: `Mock page content for ${data.siteUrl}`,
      screenshots: [],
      errorLogs: ["Browser startup failed - using mock data"],
    };
  }

  async disconnect() {
    if (this.mockMode) {
      console.log("ℹ️ Mock mode - no browser to disconnect");
      this.mockMode = false;
      return;
    }

    if (this.browser) {
      try {
        console.log("🔌 Closing browser...");
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log("✅ Browser disconnected");
      } catch (error) {
        console.error("❌ Error closing browser:", error);
      }
    } else {
      console.log("ℹ️ Browser was not connected");
    }
  }
}
