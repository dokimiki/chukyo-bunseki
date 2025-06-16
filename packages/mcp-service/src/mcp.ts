/* eslint-disable functional/no-class */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolRequest, type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createAuthenticatedContext } from "@chukyo-bunseki/playwright-worker";
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
    private globalContext: any = null;

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
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
            if (request.params.name === "analyze_manabo_page") {
                const args = request.params.arguments as unknown as AnalyzeManaboPageArgs;
                return await this.analyzeManaboPage(args);
            }

            throw new Error(`Unknown tool: ${request.params.name}`);
        });
    }

    private async analyzeManaboPage(args: AnalyzeManaboPageArgs): Promise<CallToolResult> {
        try {
            if (!this.globalContext) {
                this.globalContext = await createAuthenticatedContext();
            }

            const page = await this.globalContext.newPage();
            await page.goto(args.url);
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

    private async analyzePageStructure(page: any, pageType: ManaboPageType): Promise<ManaboPageStructure> {
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
        const dataElements = await this.extractDataElements(page, pageType);
        const navigation = await this.extractNavigation(page);

        return {
            selectors: commonSelectors,
            actions,
            dataElements,
            navigation,
        };
    }

    private async extractActions(page: any, pageType: ManaboPageType): Promise<ManaboAction[]> {
        return await page.evaluate((type: ManaboPageType) => {
            const actions: any[] = [];

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

    private async extractDataElements(page: any, pageType: ManaboPageType): Promise<ManaboDataElement[]> {
        return await page.evaluate(() => {
            const dataElements: any[] = [];

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

    private async extractNavigation(page: any): Promise<ManaboNavigation[]> {
        return await page.evaluate(() => {
            const navigation: any[] = [];

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
}

/**
 * Create and start MCP server
 */
export async function createManaboMCPServer(): Promise<ManaboMCPServer> {
    const server = new ManaboMCPServer();
    await server.start();
    return server;
}
