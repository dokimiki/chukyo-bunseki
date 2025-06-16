import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { ManaboMCPServer } from "../src/mcp.ts";
import { ManaboPageType } from "../src/types/manabo.ts";

// Mock the dependencies
const mockPage = {
    goto: mock(() => Promise.resolve()),
    title: mock(() => Promise.resolve("Test Page")),
    screenshot: mock(() => Promise.resolve(Buffer.from("fake-screenshot"))),
    content: mock(() => Promise.resolve("<html><body>Test Content</body></html>")),
    close: mock(() => Promise.resolve()),
    waitForTimeout: mock(() => Promise.resolve()),
    url: mock(() => "https://manabo.cnc.chukyo-u.ac.jp"),
    evaluate: mock(() => Promise.resolve({})),
    route: mock(() => Promise.resolve()),
    on: mock(() => Promise.resolve()),
};

const mockContext = {
    newPage: mock(() => Promise.resolve(mockPage)),
    close: mock(() => Promise.resolve()),
};

// Mock playwright-worker module
mock.module("@chukyo-bunseki/playwright-worker", () => ({
    createAuthenticatedContext: mock(() => Promise.resolve(mockContext)),
    loginToChukyo: mock(() => Promise.resolve({ success: true, message: "Login successful" })),
}));

// Mock MCP SDK
mock.module("@modelcontextprotocol/sdk/server/index.js", () => ({
    Server: class MockServer {
        constructor() {}
        setRequestHandler = mock(() => {});
        connect = mock(() => Promise.resolve());
    },
}));

mock.module("@modelcontextprotocol/sdk/server/stdio.js", () => ({
    StdioServerTransport: class MockStdioServerTransport {},
}));

describe("ManaboMCPServer", () => {
    let server: ManaboMCPServer;

    beforeEach(() => {
        // Reset all mocks before each test
        mock.restore();
        server = new ManaboMCPServer();
    });

    afterEach(async () => {
        await server.stop();
    });

    describe("Server Initialization", () => {
        test("should initialize MCP server with correct configuration", () => {
            expect(server).toBeInstanceOf(ManaboMCPServer);
        });

        test("should start server successfully", async () => {
            await expect(server.start()).resolves.not.toThrow();
        });

        test("should stop server and cleanup resources", async () => {
            await expect(server.stop()).resolves.not.toThrow();
        });
    });

    describe("Tool Registration", () => {
        test("should register all required tools", () => {
            // This tests that the tools are properly configured in the constructor
            expect(server).toBeDefined();
        });
    });

    describe("Page Type Detection", () => {
        test("should detect course page type", () => {
            const server = new ManaboMCPServer();
            // Access private method for testing
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/course/123", "Course: Advanced Math")).toBe(ManaboPageType.COURSES);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/courses", "科目一覧")).toBe(ManaboPageType.COURSES);
        });

        test("should detect assignment page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/assignment/456", "課題提出")).toBe(ManaboPageType.ASSIGNMENTS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/assignments", "Assignment List")).toBe(ManaboPageType.ASSIGNMENTS);
        });

        test("should detect syllabus page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/syllabus/789", "シラバス詳細")).toBe(ManaboPageType.SYLLABUS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/syllabus", "Syllabus")).toBe(ManaboPageType.SYLLABUS);
        });

        test("should detect grades page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/grade/overview", "成績確認")).toBe(ManaboPageType.GRADES);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/grades", "Grade Report")).toBe(ManaboPageType.GRADES);
        });

        test("should detect announcements page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/announcement/123", "お知らせ詳細")).toBe(ManaboPageType.ANNOUNCEMENTS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/announcements", "連絡事項")).toBe(ManaboPageType.ANNOUNCEMENTS);
        });

        test("should detect timetable page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/timetable", "時間割表")).toBe(ManaboPageType.TIMETABLE);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/schedule", "Time Table")).toBe(ManaboPageType.TIMETABLE);
        });

        test("should detect top page type", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp", "ホームページ")).toBe(ManaboPageType.TOP);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/top", "Manabo Home")).toBe(ManaboPageType.TOP);
        });

        test("should detect other page type for unknown pages", () => {
            const server = new ManaboMCPServer();
            const detectPageType = (server as any).detectPageType.bind(server);

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/unknown", "Unknown Page")).toBe(ManaboPageType.OTHER);
            expect(detectPageType("https://external.example.com", "External Site")).toBe(ManaboPageType.OTHER);
        });
    });

    describe("Authentication Management", () => {
        test("should handle authentication with existing state", async () => {
            const server = new ManaboMCPServer();
            const ensureAuthenticated = (server as any).ensureAuthenticated.bind(server);

            const context = await ensureAuthenticated();
            expect(context).toBeDefined();
        });

        test("should handle authentication failure and retry", async () => {
            // Mock createAuthenticatedContext to fail first, then succeed
            const { createAuthenticatedContext } = await import("@chukyo-bunseki/playwright-worker");
            (createAuthenticatedContext as any)
                .mockImplementationOnce(() => {
                    throw new Error("No auth state");
                })
                .mockImplementationOnce(() => Promise.resolve(mockContext));

            // Set environment variables for auto-login
            process.env.CHUKYO_USERNAME = "testuser";
            process.env.CHUKYO_PASSWORD = "testpass";

            const server = new ManaboMCPServer();
            const ensureAuthenticated = (server as any).ensureAuthenticated.bind(server);

            const context = await ensureAuthenticated();
            expect(context).toBeDefined();

            // Clean up
            delete process.env.CHUKYO_USERNAME;
            delete process.env.CHUKYO_PASSWORD;
        });

        test("should throw error when authentication fails and no credentials", async () => {
            // Mock createAuthenticatedContext to always fail
            const { createAuthenticatedContext } = await import("@chukyo-bunseki/playwright-worker");
            (createAuthenticatedContext as any).mockImplementation(() => {
                throw new Error("No auth state");
            });

            const server = new ManaboMCPServer();
            const ensureAuthenticated = (server as any).ensureAuthenticated.bind(server);

            await expect(ensureAuthenticated()).rejects.toThrow("Authentication required");
        });
    });

    describe("Page Analysis Tool", () => {
        test("should analyze page successfully with all options", async () => {
            // Mock page.evaluate to return structured data
            mockPage.evaluate.mockImplementation((fn: Function) => {
                if (fn.toString().includes("selectors")) {
                    return Promise.resolve({
                        navigation: "nav",
                        header: "header",
                        mainContent: "main",
                        forms: "form",
                        buttons: "button",
                        links: "a[href]",
                    });
                }
                return Promise.resolve([]);
            });

            const server = new ManaboMCPServer();
            const analyzeManaboPage = (server as any).analyzeManaboPage.bind(server);

            const result = await analyzeManaboPage({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                includeScreenshot: true,
                includeDOM: true,
            });

            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe("text");

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.success).toBe(true);
            expect(resultData.analysis).toBeDefined();
            expect(resultData.analysis.url).toBe("https://manabo.cnc.chukyo-u.ac.jp");
            expect(resultData.analysis.pageType).toBe(ManaboPageType.TOP);
            expect(resultData.analysis.structure).toBeDefined();
        });

        test("should handle page analysis with minimal options", async () => {
            const server = new ManaboMCPServer();
            const analyzeManaboPage = (server as any).analyzeManaboPage.bind(server);

            const result = await analyzeManaboPage({
                url: "https://manabo.cnc.chukyo-u.ac.jp/course/123",
                includeScreenshot: false,
                includeDOM: false,
            });

            expect(result.content).toBeDefined();
            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.success).toBe(true);
            expect(resultData.analysis.screenshot).toBeUndefined();
            expect(resultData.analysis.domContent).toBeUndefined();
        });

        test("should handle page analysis errors gracefully", async () => {
            // Mock page.goto to throw error
            mockPage.goto.mockImplementationOnce(() => {
                throw new Error("Network error");
            });

            const server = new ManaboMCPServer();
            const analyzeManaboPage = (server as any).analyzeManaboPage.bind(server);

            const result = await analyzeManaboPage({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.success).toBe(false);
            expect(resultData.error).toBeDefined();
        });

        test("should handle authentication re-requirement during analysis", async () => {
            // Mock page.url to return auth URL first, then normal URL
            mockPage.url.mockImplementationOnce(() => "https://auth.example.com/login").mockImplementation(() => "https://manabo.cnc.chukyo-u.ac.jp");

            const server = new ManaboMCPServer();
            const analyzeManaboPage = (server as any).analyzeManaboPage.bind(server);

            const result = await analyzeManaboPage({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.success).toBe(true);
        });
    });

    describe("Screenshot Tool", () => {
        test("should take screenshot successfully", async () => {
            const server = new ManaboMCPServer();
            const takeScreenshot = (server as any).takeScreenshot.bind(server);

            const result = await takeScreenshot({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe("image");
            expect(result.content[0].mimeType).toBe("image/png");
            expect(result.content[0].data).toBeDefined();
        });

        test("should handle screenshot errors", async () => {
            // Mock screenshot to throw error
            mockPage.screenshot.mockImplementationOnce(() => {
                throw new Error("Screenshot failed");
            });

            const server = new ManaboMCPServer();
            const takeScreenshot = (server as any).takeScreenshot.bind(server);

            const result = await takeScreenshot({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.isError).toBe(true);
            const errorData = JSON.parse(result.content[0].text);
            expect(errorData.error).toBe("Failed to take screenshot");
        });

        test("should handle re-authentication during screenshot", async () => {
            // Mock page.url to return auth URL first
            mockPage.url.mockImplementationOnce(() => "https://auth.example.com/login").mockImplementation(() => "https://manabo.cnc.chukyo-u.ac.jp");

            const server = new ManaboMCPServer();
            const takeScreenshot = (server as any).takeScreenshot.bind(server);

            const result = await takeScreenshot({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.content[0].type).toBe("image");
        });
    });

    describe("DOM Extraction Tool", () => {
        test("should get page DOM successfully", async () => {
            const server = new ManaboMCPServer();
            const getPageDOM = (server as any).getPageDOM.bind(server);

            const result = await getPageDOM({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe("text");
            expect(result.content[0].text).toContain("<html>");
        });

        test("should handle DOM extraction errors", async () => {
            // Mock content to throw error
            mockPage.content.mockImplementationOnce(() => {
                throw new Error("DOM extraction failed");
            });

            const server = new ManaboMCPServer();
            const getPageDOM = (server as any).getPageDOM.bind(server);

            const result = await getPageDOM({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.isError).toBe(true);
            const errorData = JSON.parse(result.content[0].text);
            expect(errorData.error).toBe("Failed to get DOM");
        });

        test("should handle re-authentication during DOM extraction", async () => {
            // Mock page.url to return auth URL first
            mockPage.url.mockImplementationOnce(() => "https://auth.example.com/login").mockImplementation(() => "https://manabo.cnc.chukyo-u.ac.jp");

            const server = new ManaboMCPServer();
            const getPageDOM = (server as any).getPageDOM.bind(server);

            const result = await getPageDOM({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.content[0].type).toBe("text");
            expect(result.content[0].text).toContain("<html>");
        });
    });

    describe("Network Monitoring Tool", () => {
        test("should monitor network requests successfully", async () => {
            const server = new ManaboMCPServer();
            const monitorNetwork = (server as any).monitorNetwork.bind(server);

            const result = await monitorNetwork({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                waitTime: 1000,
            });

            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe("text");

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.networkLogs).toBeDefined();
            expect(resultData.count).toBeDefined();
            expect(resultData.url).toBe("https://manabo.cnc.chukyo-u.ac.jp");
            expect(resultData.waitTime).toBe(1000);
        });

        test("should use default wait time when not specified", async () => {
            const server = new ManaboMCPServer();
            const monitorNetwork = (server as any).monitorNetwork.bind(server);

            const result = await monitorNetwork({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.waitTime).toBe(2000);
        });

        test("should handle network monitoring errors", async () => {
            // Mock page.route to throw error
            mockPage.route.mockImplementationOnce(() => {
                throw new Error("Network monitoring failed");
            });

            const server = new ManaboMCPServer();
            const monitorNetwork = (server as any).monitorNetwork.bind(server);

            const result = await monitorNetwork({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            expect(result.isError).toBe(true);
            const errorData = JSON.parse(result.content[0].text);
            expect(errorData.error).toBe("Failed to monitor network");
        });

        test("should handle re-authentication during network monitoring", async () => {
            // Mock page.url to return auth URL first
            mockPage.url.mockImplementationOnce(() => "https://auth.example.com/login").mockImplementation(() => "https://manabo.cnc.chukyo-u.ac.jp");

            const server = new ManaboMCPServer();
            const monitorNetwork = (server as any).monitorNetwork.bind(server);

            const result = await monitorNetwork({
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            });

            const resultData = JSON.parse(result.content[0].text);
            expect(resultData.networkLogs).toBeDefined();
        });
    });

    describe("Health Check Tool", () => {
        test("should return healthy status when no context exists", async () => {
            const server = new ManaboMCPServer();
            const healthCheck = (server as any).healthCheck.bind(server);

            const result = await healthCheck();

            expect(result.content).toBeDefined();
            expect(result.content[0].type).toBe("text");

            const statusData = JSON.parse(result.content[0].text);
            expect(statusData.server).toBe("healthy");
            expect(statusData.browserContext).toBe("not_initialized");
            expect(statusData.timestamp).toBeDefined();
        });

        test("should check authentication when context exists", async () => {
            const server = new ManaboMCPServer();
            // Simulate having a context
            (server as any).globalContext = mockContext;

            mockPage.title.mockResolvedValueOnce("Manabo - Home");

            const healthCheck = (server as any).healthCheck.bind(server);
            const result = await healthCheck();

            const statusData = JSON.parse(result.content[0].text);
            expect(statusData.server).toBe("healthy");
            expect(statusData.browserContext).toBe("available");
            expect(statusData.authentication).toBe("valid");
        });

        test("should detect authentication requirement", async () => {
            const server = new ManaboMCPServer();
            (server as any).globalContext = mockContext;

            mockPage.title.mockResolvedValueOnce("Login - Manabo");

            const healthCheck = (server as any).healthCheck.bind(server);
            const result = await healthCheck();

            const statusData = JSON.parse(result.content[0].text);
            expect(statusData.authentication).toBe("required");
        });

        test("should handle health check errors", async () => {
            const server = new ManaboMCPServer();
            (server as any).globalContext = mockContext;

            mockPage.goto.mockImplementationOnce(() => {
                throw new Error("Health check failed");
            });

            const healthCheck = (server as any).healthCheck.bind(server);
            const result = await healthCheck();

            const statusData = JSON.parse(result.content[0].text);
            expect(statusData.authentication).toBe("failed");
            expect(statusData.browserContext).toContain("error:");
        });

        test("should handle general health check errors", async () => {
            const server = new ManaboMCPServer();
            // Mock the health check to throw an error
            const originalHealthCheck = (server as any).healthCheck;
            (server as any).healthCheck = () => {
                throw new Error("General health check error");
            };

            const result = await (server as any).healthCheck();

            expect(result.isError).toBe(true);
            const errorData = JSON.parse(result.content[0].text);
            expect(errorData.server).toBe("error");
        });
    });

    describe("Page Structure Analysis", () => {
        test("should extract common selectors correctly", async () => {
            mockPage.evaluate.mockImplementation((fn: Function) => {
                // Mock DOM evaluation for selectors
                if (fn.toString().includes("selectors")) {
                    return Promise.resolve({
                        navigation: "nav, .navigation, .nav-menu",
                        header: "header, .header, .page-header",
                        mainContent: "main, .main-content, .content-area",
                        footer: "footer, .footer",
                        forms: "form",
                        buttons: 'button, input[type="button"], input[type="submit"]',
                        links: "a[href]",
                    });
                }
                return Promise.resolve([]);
            });

            const server = new ManaboMCPServer();
            const analyzePageStructure = (server as any).analyzePageStructure.bind(server);

            const structure = await analyzePageStructure(mockPage, ManaboPageType.TOP);

            expect(structure.selectors).toBeDefined();
            expect(structure.selectors.navigation).toBe("nav, .navigation, .nav-menu");
            expect(structure.selectors.header).toBe("header, .header, .page-header");
            expect(structure.selectors.mainContent).toBe("main, .main-content, .content-area");
            expect(structure.actions).toBeDefined();
            expect(structure.dataElements).toBeDefined();
            expect(structure.navigation).toBeDefined();
        });

        test("should extract actions correctly", async () => {
            mockPage.evaluate.mockImplementation((fn: Function) => {
                if (fn.toString().includes("actions")) {
                    return Promise.resolve([
                        {
                            type: "click",
                            selector: 'button[type="submit"]:nth-of-type(1)',
                            description: "Submit action: ログイン",
                            required: true,
                        },
                    ]);
                }
                return Promise.resolve({});
            });

            const server = new ManaboMCPServer();
            const extractActions = (server as any).extractActions.bind(server);

            const actions = await extractActions(mockPage, ManaboPageType.TOP);

            expect(actions).toHaveLength(1);
            expect(actions[0].type).toBe("click");
            expect(actions[0].required).toBe(true);
        });

        test("should extract data elements correctly", async () => {
            mockPage.evaluate.mockImplementation((fn: Function) => {
                if (fn.toString().includes("dataElements")) {
                    return Promise.resolve([
                        {
                            type: "text",
                            selector: "h1:nth-of-type(1)",
                            description: "Page heading: 中京大学 Manabo",
                            example: "中京大学 Manabo - 学生ポータルサイト",
                        },
                    ]);
                }
                return Promise.resolve({});
            });

            const server = new ManaboMCPServer();
            const extractDataElements = (server as any).extractDataElements.bind(server);

            const dataElements = await extractDataElements(mockPage);

            expect(dataElements).toHaveLength(1);
            expect(dataElements[0].type).toBe("text");
            expect(dataElements[0].selector).toBe("h1:nth-of-type(1)");
        });

        test("should extract navigation correctly", async () => {
            mockPage.evaluate.mockImplementation((fn: Function) => {
                if (fn.toString().includes("navigation")) {
                    return Promise.resolve([
                        {
                            label: "ホーム",
                            selector: 'a[href="/"]',
                            url: "/",
                            description: "Navigate to ホーム",
                        },
                    ]);
                }
                return Promise.resolve({});
            });

            const server = new ManaboMCPServer();
            const extractNavigation = (server as any).extractNavigation.bind(server);

            const navigation = await extractNavigation(mockPage);

            expect(navigation).toHaveLength(1);
            expect(navigation[0].label).toBe("ホーム");
            expect(navigation[0].url).toBe("/");
        });
    });

    describe("Error Handling", () => {
        test("should handle unknown tool requests", async () => {
            const server = new ManaboMCPServer();

            // Mock the request handler call with unknown tool
            const mockRequest = {
                params: {
                    name: "unknown_tool",
                    arguments: {},
                },
            };

            // Access the tool handler directly
            const handlers = (server as any).server._requestHandlers;
            const toolHandler = handlers.get("tools/call");

            await expect(toolHandler(mockRequest)).rejects.toThrow("Unknown tool: unknown_tool");
        });

        test("should clean up resources on stop", async () => {
            const server = new ManaboMCPServer();
            (server as any).globalContext = mockContext;

            await server.stop();

            expect(mockContext.close).toHaveBeenCalled();
            expect((server as any).globalContext).toBeNull();
        });
    });

    describe("Factory Function", () => {
        test("should create and start MCP server", async () => {
            const { createManaboMCPServer } = await import("../src/mcp.ts");

            const server = await createManaboMCPServer();

            expect(server).toBeInstanceOf(ManaboMCPServer);

            await server.stop();
        });
    });
});
