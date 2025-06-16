import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createAuthenticatedContext, loginToChukyo } from "@chukyo-bunseki/playwright-worker";
import { type BrowserContext, type Page } from "playwright";
import {
    type AnalyzeManaboPageArgs,
    type AnalyzeManaboPageResult,
    type ManaboPageAnalysis,
    ManaboPageType,
    type ManaboPageStructure,
    type ManaboAction,
    type ManaboDataElement,
    type ManaboNavigation,
} from "./types/manabo.js";

/**
 * MCP Server for Manabo HTML structure analysis
 */
export class ManaboMCPServer {
    private server: Server;
    private globalContext: BrowserContext | null = null;

    constructor() {
        this.server = new Server(
            {
                name: "manabo-analyzer",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
    }

    private setupToolHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "analyze_manabo_page",
                        description: "Analyze Manabo page structure and provide HTML selectors and interaction patterns",
                        inputSchema: {
                            type: "object",
                            properties: {
                                url: {
                                    type: "string",
                                    description: "URL of the Manabo page to analyze",
                                },
                                includeScreenshot: {
                                    type: "boolean",
                                    description: "Whether to include a screenshot in the analysis",
                                    default: false,
                                },
                                includeDOM: {
                                    type: "boolean",
                                    description: "Whether to include DOM content in the analysis",
                                    default: true,
                                },
                            },
                            required: ["url"],
                        },
                    },
                    {
                        name: "take_screenshot",
                        description: "Take a full page screenshot of a Manabo page",
                        inputSchema: {
                            type: "object",
                            properties: {
                                url: {
                                    type: "string",
                                    description: "URL of the page to screenshot",
                                    default: "https://manabo.cnc.chukyo-u.ac.jp",
                                },
                            },
                            required: ["url"],
                        },
                    },
                    {
                        name: "get_page_dom",
                        description: "Get the HTML DOM content of a Manabo page",
                        inputSchema: {
                            type: "object",
                            properties: {
                                url: {
                                    type: "string",
                                    description: "URL of the page to get DOM from",
                                    default: "https://manabo.cnc.chukyo-u.ac.jp",
                                },
                            },
                            required: ["url"],
                        },
                    },
                    {
                        name: "monitor_network",
                        description: "Monitor network requests (XHR/API calls) on a Manabo page",
                        inputSchema: {
                            type: "object",
                            properties: {
                                url: {
                                    type: "string",
                                    description: "URL of the page to monitor network requests",
                                    default: "https://manabo.cnc.chukyo-u.ac.jp",
                                },
                                waitTime: {
                                    type: "number",
                                    description: "Time to wait for network requests in milliseconds",
                                    default: 2000,
                                },
                            },
                            required: ["url"],
                        },
                    },
                    {
                        name: "health_check",
                        description: "Check the health status of the MCP server and browser context",
                        inputSchema: {
                            type: "object",
                            properties: {},
                            additionalProperties: false,
                        },
                    },
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
            if (request.params.name === "analyze_manabo_page") {
                const args = request.params.arguments as unknown as AnalyzeManaboPageArgs;
                return await this.analyzeManaboPage(args);
            }

            if (request.params.name === "take_screenshot") {
                const args = request.params.arguments as { url: string };
                return await this.takeScreenshot(args);
            }

            if (request.params.name === "get_page_dom") {
                const args = request.params.arguments as { url: string };
                return await this.getPageDOM(args);
            }

            if (request.params.name === "monitor_network") {
                const args = request.params.arguments as { url: string; waitTime?: number };
                return await this.monitorNetwork(args);
            }

            if (request.params.name === "health_check") {
                return await this.healthCheck();
            }

            throw new Error(`Unknown tool: ${request.params.name}`);
        });
    }

    private async analyzeManaboPage(args: AnalyzeManaboPageArgs): Promise<CallToolResult> {
        try {
            if (!this.globalContext) {
                this.globalContext = await this.ensureAuthenticated();
            }

            let page = await this.globalContext.newPage();

            // Check if we need to login by testing page access
            try {
                await page.goto(args.url);
                // If we reach a login page or get redirected, re-authenticate
                if (page.url().includes("auth") || page.url().includes("login") || page.url().includes("shibboleth")) {
                    console.error("Authentication required, re-authenticating...");
                    await this.globalContext.close();
                    this.globalContext = await this.ensureAuthenticated();
                    await page.close();
                    page = await this.globalContext.newPage();
                    await page.goto(args.url);
                }
            } catch (error) {
                console.error("Page access failed, attempting re-authentication:", error);
                await this.globalContext?.close();
                this.globalContext = await this.ensureAuthenticated();
                await page.close();
                page = await this.globalContext.newPage();
                await page.goto(args.url);
            }
            await page.waitForTimeout(2000); // Wait for dynamic content

            const title = await page.title();
            const pageType = this.detectPageType(args.url, title);

            // Get screenshot if requested
            let screenshot: string | undefined;
            if (args.includeScreenshot) {
                const screenshotBuffer = await page.screenshot({
                    fullPage: true,
                    type: "png",
                });
                screenshot = screenshotBuffer.toString("base64");
            }

            // Get DOM content if requested
            let domContent: string | undefined;
            if (args.includeDOM) {
                domContent = await page.content();
            }

            // Analyze page structure
            const structure = await this.analyzePageStructure(page, pageType);

            const analysis: ManaboPageAnalysis = {
                url: args.url,
                title,
                pageType,
                structure,
                screenshot,
                domContent,
                timestamp: new Date().toISOString(),
            };

            await page.close();

            const result: AnalyzeManaboPageResult = {
                success: true,
                analysis,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error) {
            const result: AnalyzeManaboPageResult = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
    }

    private detectPageType(url: string, title: string): ManaboPageType {
        if (url.includes("/course/") || title.includes("科目") || title.includes("Course")) {
            return ManaboPageType.COURSES;
        }
        if (url.includes("/assignment") || title.includes("課題") || title.includes("Assignment")) {
            return ManaboPageType.ASSIGNMENTS;
        }
        if (url.includes("/syllabus") || title.includes("シラバス") || title.includes("Syllabus")) {
            return ManaboPageType.SYLLABUS;
        }
        if (url.includes("/grade") || title.includes("成績") || title.includes("Grade")) {
            return ManaboPageType.GRADES;
        }
        if (url.includes("/announcement") || title.includes("お知らせ") || title.includes("連絡")) {
            return ManaboPageType.ANNOUNCEMENTS;
        }
        if (url.includes("/timetable") || title.includes("時間割") || title.includes("Time")) {
            return ManaboPageType.TIMETABLE;
        }
        if (url === "https://manabo.cnc.chukyo-u.ac.jp" || url.includes("/top") || title.includes("ホーム")) {
            return ManaboPageType.TOP;
        }
        return ManaboPageType.OTHER;
    }

    private async analyzePageStructure(page: Page, pageType: ManaboPageType): Promise<ManaboPageStructure> {
        // Common selectors for all Manabo pages
        const commonSelectors = await page.evaluate(() => {
            const selectors: Record<string, string> = {};

            // Navigation elements
            if (document.querySelector("nav") || document.querySelector(".navigation")) {
                selectors.navigation = "nav, .navigation, .nav-menu";
            }

            // Header
            if (document.querySelector("header") || document.querySelector(".header")) {
                selectors.header = "header, .header, .page-header";
            }

            // Main content area
            if (document.querySelector("main") || document.querySelector(".main-content")) {
                selectors.mainContent = "main, .main-content, .content-area";
            }

            // Footer
            if (document.querySelector("footer") || document.querySelector(".footer")) {
                selectors.footer = "footer, .footer";
            }

            // Form elements
            const forms = document.querySelectorAll("form");
            if (forms.length > 0) {
                selectors.forms = "form";
            }

            // Buttons
            const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
            if (buttons.length > 0) {
                selectors.buttons = 'button, input[type="button"], input[type="submit"]';
            }

            // Links
            const links = document.querySelectorAll("a[href]");
            if (links.length > 0) {
                selectors.links = "a[href]";
            }

            return selectors;
        });

        // Page-specific analysis
        const actions = await this.extractActions(page, pageType);
        const dataElements = await this.extractDataElements(page);
        const navigation = await this.extractNavigation(page);

        return {
            selectors: commonSelectors,
            actions,
            dataElements,
            navigation,
        };
    }

    private async extractActions(page: Page, pageType: ManaboPageType): Promise<ManaboAction[]> {
        return await page.evaluate(() => {
            const actions: Array<{
                type: "click" | "form" | "navigation";
                selector: string;
                description: string;
                required?: boolean;
            }> = [];

            // Common actions
            const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
            submitButtons.forEach((button, index) => {
                const text = button.textContent?.trim() || `Submit button ${index + 1}`;
                actions.push({
                    type: "click",
                    selector: `button[type="submit"]:nth-of-type(${index + 1}), input[type="submit"]:nth-of-type(${index + 1})`,
                    description: `Submit action: ${text}`,
                    required: true,
                });
            });

            return actions;
        }, pageType);
    }

    private async extractDataElements(page: Page): Promise<ManaboDataElement[]> {
        return await page.evaluate(() => {
            const dataElements: Array<{
                type: "text" | "list" | "table" | "link" | "date";
                selector: string;
                description: string;
                example?: string;
            }> = [];

            // Common data elements
            const headings = document.querySelectorAll("h1, h2, h3");
            headings.forEach((heading, index) => {
                const text = heading.textContent?.trim() || "";
                if (text) {
                    dataElements.push({
                        type: "text",
                        selector: `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
                        description: `Page heading: ${text.substring(0, 50)}`,
                        example: text.substring(0, 100),
                    });
                }
            });

            return dataElements;
        });
    }

    private async extractNavigation(page: Page): Promise<ManaboNavigation[]> {
        return await page.evaluate(() => {
            const navigation: Array<{
                label: string;
                selector: string;
                url?: string;
                description: string;
            }> = [];

            // Main navigation
            const navLinks = document.querySelectorAll("nav a, .navigation a, .nav-menu a");
            navLinks.forEach((link) => {
                const text = link.textContent?.trim() || "";
                const href = link.getAttribute("href") || "";
                if (text && href) {
                    navigation.push({
                        label: text,
                        selector: `a[href="${href}"]`,
                        url: href,
                        description: `Navigate to ${text}`,
                    });
                }
            });

            return navigation;
        });
    }

    /**
     * Start the MCP server
     */
    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }

    /**
     * Stop the server and cleanup resources
     */
    async stop(): Promise<void> {
        if (this.globalContext) {
            await this.globalContext.close();
            this.globalContext = null;
        }
    }

    /**
     * Ensure we have an authenticated context, attempting auto-login if needed
     * @returns Authenticated browser context
     * @throws Error if authentication fails and no credentials are available
     */
    private async ensureAuthenticated(): Promise<BrowserContext> {
        try {
            // First try to create context with existing state
            return await createAuthenticatedContext();
        } catch {
            console.error("No existing authentication state, attempting auto-login...");

            // Try to get credentials from environment variables
            const username = process.env.CHUKYO_USERNAME;
            const password = process.env.CHUKYO_PASSWORD;

            if (!username || !password) {
                throw new Error(
                    "Authentication required but no saved state found and no credentials provided.\n" +
                        "Please either:\n" +
                        "1. Run login first using the CLI: ./chukyo-cli login -u <username> -p <password>\n" +
                        "2. Set environment variables: CHUKYO_USERNAME and CHUKYO_PASSWORD"
                );
            }

            console.error(`Attempting login for user: ${username}`);
            const loginResult = await loginToChukyo({
                username,
                password,
                headless: true,
            });

            if (!loginResult.success) {
                throw new Error(`Login failed: ${loginResult.message}`);
            }

            console.error("Login successful, creating authenticated context...");
            return await createAuthenticatedContext();
        }
    }

    private async takeScreenshot(args: { url: string }): Promise<CallToolResult> {
        try {
            if (!this.globalContext) {
                this.globalContext = await this.ensureAuthenticated();
            }

            const page = await this.globalContext.newPage();

            try {
                await page.goto(args.url);

                // Check if we need to re-authenticate
                if (page.url().includes("auth") || page.url().includes("login") || page.url().includes("shibboleth")) {
                    console.error("Authentication required, re-authenticating...");
                    await this.globalContext.close();
                    this.globalContext = await this.ensureAuthenticated();
                    await page.close();
                    const newPage = await this.globalContext.newPage();
                    await newPage.goto(args.url);

                    const screenshot = await newPage.screenshot({
                        fullPage: true,
                        type: "png",
                    });

                    await newPage.close();

                    return {
                        content: [
                            {
                                type: "image",
                                data: screenshot.toString("base64"),
                                mimeType: "image/png",
                            },
                        ],
                    };
                }

                const screenshot = await page.screenshot({
                    fullPage: true,
                    type: "png",
                });

                await page.close();

                return {
                    content: [
                        {
                            type: "image",
                            data: screenshot.toString("base64"),
                            mimeType: "image/png",
                        },
                    ],
                };
            } catch (error) {
                await page.close();
                throw error;
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                error: "Failed to take screenshot",
                                message: error instanceof Error ? error.message : "Unknown error",
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
    }

    private async getPageDOM(args: { url: string }): Promise<CallToolResult> {
        try {
            if (!this.globalContext) {
                this.globalContext = await this.ensureAuthenticated();
            }

            const page = await this.globalContext.newPage();

            try {
                await page.goto(args.url);

                // Check if we need to re-authenticate
                if (page.url().includes("auth") || page.url().includes("login") || page.url().includes("shibboleth")) {
                    console.error("Authentication required, re-authenticating...");
                    await this.globalContext.close();
                    this.globalContext = await this.ensureAuthenticated();
                    await page.close();
                    const newPage = await this.globalContext.newPage();
                    await newPage.goto(args.url);

                    const content = await newPage.content();
                    await newPage.close();

                    return {
                        content: [
                            {
                                type: "text",
                                text: content,
                            },
                        ],
                    };
                }

                const content = await page.content();
                await page.close();

                return {
                    content: [
                        {
                            type: "text",
                            text: content,
                        },
                    ],
                };
            } catch (error) {
                await page.close();
                throw error;
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                error: "Failed to get DOM",
                                message: error instanceof Error ? error.message : "Unknown error",
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
    }

    private async monitorNetwork(args: { url: string; waitTime?: number }): Promise<CallToolResult> {
        try {
            if (!this.globalContext) {
                this.globalContext = await this.ensureAuthenticated();
            }

            const page = await this.globalContext.newPage();
            const networkLogs: Array<{
                url: string;
                method: string;
                status?: number;
                timestamp: string;
                headers?: Record<string, string>;
            }> = [];

            try {
                // Intercept network requests
                page.route("**/api/**", (route) => {
                    const request = route.request();
                    networkLogs.push({
                        url: request.url(),
                        method: request.method(),
                        timestamp: new Date().toISOString(),
                        headers: request.headers(),
                    });
                    route.continue();
                });

                // Also listen to response events for status codes
                page.on("response", (response) => {
                    if (response.url().includes("/api/")) {
                        const log = networkLogs.find((log) => log.url === response.url());
                        if (log) {
                            log.status = response.status();
                        }
                    }
                });

                await page.goto(args.url);

                // Check if we need to re-authenticate
                if (page.url().includes("auth") || page.url().includes("login") || page.url().includes("shibboleth")) {
                    console.error("Authentication required, re-authenticating...");
                    await this.globalContext.close();
                    this.globalContext = await this.ensureAuthenticated();
                    await page.close();
                    const newPage = await this.globalContext.newPage();

                    // Re-setup network monitoring on new page
                    const newNetworkLogs: typeof networkLogs = [];
                    newPage.route("**/api/**", (route) => {
                        const request = route.request();
                        newNetworkLogs.push({
                            url: request.url(),
                            method: request.method(),
                            timestamp: new Date().toISOString(),
                            headers: request.headers(),
                        });
                        route.continue();
                    });

                    newPage.on("response", (response) => {
                        if (response.url().includes("/api/")) {
                            const log = newNetworkLogs.find((log) => log.url === response.url());
                            if (log) {
                                log.status = response.status();
                            }
                        }
                    });

                    await newPage.goto(args.url);
                    await newPage.waitForTimeout(args.waitTime || 2000);
                    await newPage.close();

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(
                                    {
                                        networkLogs: newNetworkLogs,
                                        count: newNetworkLogs.length,
                                        url: args.url,
                                        waitTime: args.waitTime || 2000,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                }

                // Wait for network requests to complete
                await page.waitForTimeout(args.waitTime || 2000);
                await page.close();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    networkLogs,
                                    count: networkLogs.length,
                                    url: args.url,
                                    waitTime: args.waitTime || 2000,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                await page.close();
                throw error;
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                error: "Failed to monitor network",
                                message: error instanceof Error ? error.message : "Unknown error",
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
    }

    private async healthCheck(): Promise<CallToolResult> {
        try {
            const status = {
                server: "healthy",
                timestamp: new Date().toISOString(),
                browserContext: this.globalContext ? "available" : "not_initialized",
                authentication: "unknown",
            };

            // Test browser context if available
            if (this.globalContext) {
                try {
                    const page = await this.globalContext.newPage();
                    await page.goto("https://manabo.cnc.chukyo-u.ac.jp");
                    const title = await page.title();
                    await page.close();

                    if (title.includes("Manabo")) {
                        status.authentication = "valid";
                    } else if (title.includes("Login") || title.includes("ログイン")) {
                        status.authentication = "required";
                    } else {
                        status.authentication = "unknown";
                    }
                } catch (contextError) {
                    status.authentication = "failed";
                    status.browserContext = `error: ${contextError instanceof Error ? contextError.message : "Unknown error"}`;
                }
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(status, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                server: "error",
                                error: error instanceof Error ? error.message : "Unknown error",
                                timestamp: new Date().toISOString(),
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };
        }
    }
}

/**
 * Create and start MCP server
 */
export async function createManaboMCPServer(): Promise<ManaboMCPServer> {
    const server = new ManaboMCPServer();
    await server.start();
    return server;
}
