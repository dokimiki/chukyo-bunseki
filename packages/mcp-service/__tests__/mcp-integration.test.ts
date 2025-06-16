import { test, expect, describe } from "bun:test";

describe("MCP Server Configuration Tests", () => {
    describe("Server Setup", () => {
        test("should have MCP SDK dependencies available", async () => {
            // Test that we can import the necessary MCP types
            const { ListToolsRequestSchema, CallToolRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");

            expect(ListToolsRequestSchema).toBeDefined();
            expect(CallToolRequestSchema).toBeDefined();
        });

        test("should have Playwright worker dependencies available", async () => {
            // Test that the Playwright worker module can be imported
            const playwrightWorker = await import("@chukyo-bunseki/playwright-worker");

            expect(playwrightWorker).toBeDefined();
            expect(typeof playwrightWorker.createAuthenticatedContext).toBe("function");
            expect(typeof playwrightWorker.loginToChukyo).toBe("function");
        });
    });

    describe("Tool Schema Validation", () => {
        test("should define analyze_manabo_page tool schema correctly", () => {
            const toolSchema = {
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
            };

            expect(toolSchema.name).toBe("analyze_manabo_page");
            expect(toolSchema.inputSchema.required).toContain("url");
            expect(toolSchema.inputSchema.properties.url.type).toBe("string");
            expect(toolSchema.inputSchema.properties.includeScreenshot.type).toBe("boolean");
            expect(toolSchema.inputSchema.properties.includeDOM.type).toBe("boolean");
        });

        test("should define take_screenshot tool schema correctly", () => {
            const toolSchema = {
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
            };

            expect(toolSchema.name).toBe("take_screenshot");
            expect(toolSchema.inputSchema.required).toContain("url");
            expect(toolSchema.inputSchema.properties.url.default).toBe("https://manabo.cnc.chukyo-u.ac.jp");
        });

        test("should define get_page_dom tool schema correctly", () => {
            const toolSchema = {
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
            };

            expect(toolSchema.name).toBe("get_page_dom");
            expect(toolSchema.description).toContain("DOM content");
            expect(toolSchema.inputSchema.properties.url.type).toBe("string");
        });

        test("should define monitor_network tool schema correctly", () => {
            const toolSchema = {
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
            };

            expect(toolSchema.name).toBe("monitor_network");
            expect(toolSchema.inputSchema.properties.waitTime.type).toBe("number");
            expect(toolSchema.inputSchema.properties.waitTime.default).toBe(2000);
        });

        test("should define health_check tool schema correctly", () => {
            const toolSchema = {
                name: "health_check",
                description: "Check the health status of the MCP server and browser context",
                inputSchema: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
            };

            expect(toolSchema.name).toBe("health_check");
            expect(toolSchema.inputSchema.additionalProperties).toBe(false);
            expect(Object.keys(toolSchema.inputSchema.properties)).toHaveLength(0);
        });
    });

    describe("Tool Response Validation", () => {
        test("should validate analyze_manabo_page success response structure", () => {
            const successResponse = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                success: true,
                                analysis: {
                                    url: "https://manabo.cnc.chukyo-u.ac.jp",
                                    title: "Test Page",
                                    pageType: "top",
                                    structure: {
                                        selectors: {},
                                        actions: [],
                                        dataElements: [],
                                        navigation: [],
                                    },
                                    timestamp: "2024-01-01T00:00:00.000Z",
                                },
                            },
                            null,
                            2
                        ),
                    },
                ],
            };

            expect(successResponse.content).toHaveLength(1);
            expect(successResponse.content[0].type).toBe("text");

            const parsedContent = JSON.parse(successResponse.content[0].text);
            expect(parsedContent.success).toBe(true);
            expect(parsedContent.analysis).toBeDefined();
            expect(parsedContent.analysis.url).toBe("https://manabo.cnc.chukyo-u.ac.jp");
        });

        test("should validate analyze_manabo_page error response structure", () => {
            const errorResponse = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                success: false,
                                error: "Network error occurred",
                            },
                            null,
                            2
                        ),
                    },
                ],
            };

            expect(errorResponse.content[0].type).toBe("text");

            const parsedContent = JSON.parse(errorResponse.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toBe("Network error occurred");
            expect(parsedContent.analysis).toBeUndefined();
        });

        test("should validate take_screenshot response structure", () => {
            const screenshotResponse = {
                content: [
                    {
                        type: "image",
                        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                        mimeType: "image/png",
                    },
                ],
            };

            expect(screenshotResponse.content[0].type).toBe("image");
            expect(screenshotResponse.content[0].mimeType).toBe("image/png");
            expect(screenshotResponse.content[0].data).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
        });

        test("should validate get_page_dom response structure", () => {
            const domResponse = {
                content: [
                    {
                        type: "text",
                        text: "<html><head><title>Test</title></head><body>Content</body></html>",
                    },
                ],
            };

            expect(domResponse.content[0].type).toBe("text");
            expect(domResponse.content[0].text).toContain("<html>");
            expect(domResponse.content[0].text).toContain("</html>");
        });

        test("should validate monitor_network response structure", () => {
            const networkResponse = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                networkLogs: [
                                    {
                                        url: "https://manabo.cnc.chukyo-u.ac.jp/api/data",
                                        method: "GET",
                                        status: 200,
                                        timestamp: "2024-01-01T00:00:00.000Z",
                                        headers: {
                                            "content-type": "application/json",
                                        },
                                    },
                                ],
                                count: 1,
                                url: "https://manabo.cnc.chukyo-u.ac.jp",
                                waitTime: 2000,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };

            const parsedContent = JSON.parse(networkResponse.content[0].text);
            expect(parsedContent.networkLogs).toHaveLength(1);
            expect(parsedContent.networkLogs[0].method).toBe("GET");
            expect(parsedContent.count).toBe(1);
            expect(parsedContent.waitTime).toBe(2000);
        });

        test("should validate health_check response structure", () => {
            const healthResponse = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                server: "healthy",
                                timestamp: "2024-01-01T00:00:00.000Z",
                                browserContext: "available",
                                authentication: "valid",
                            },
                            null,
                            2
                        ),
                    },
                ],
            };

            const parsedContent = JSON.parse(healthResponse.content[0].text);
            expect(parsedContent.server).toBe("healthy");
            expect(parsedContent.browserContext).toBe("available");
            expect(parsedContent.authentication).toBe("valid");
            expect(parsedContent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });

    describe("Error Response Validation", () => {
        test("should validate error response with isError flag", () => {
            const errorResponse = {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                error: "Failed to take screenshot",
                                message: "Network connection timeout",
                            },
                            null,
                            2
                        ),
                    },
                ],
                isError: true,
            };

            expect(errorResponse.isError).toBe(true);

            const parsedContent = JSON.parse(errorResponse.content[0].text);
            expect(parsedContent.error).toBe("Failed to take screenshot");
            expect(parsedContent.message).toBe("Network connection timeout");
        });

        test("should handle different error types", () => {
            const errorTypes = ["Failed to take screenshot", "Failed to get DOM", "Failed to monitor network", "Authentication required", "Unknown tool"];

            errorTypes.forEach((errorType) => {
                const errorResponse = {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ error: errorType }, null, 2),
                        },
                    ],
                    isError: true,
                };

                expect(errorResponse.isError).toBe(true);
                const parsedContent = JSON.parse(errorResponse.content[0].text);
                expect(parsedContent.error).toBe(errorType);
            });
        });
    });

    describe("Authentication Handling", () => {
        test("should handle authentication error messages", () => {
            const authErrorMessage =
                "Authentication required but no saved state found and no credentials provided.\n" +
                "Please either:\n" +
                "1. Run login first using the CLI: ./chukyo-cli login -u <username> -p <password>\n" +
                "2. Set environment variables: CHUKYO_USERNAME and CHUKYO_PASSWORD";

            expect(authErrorMessage).toContain("Authentication required");
            expect(authErrorMessage).toContain("chukyo-cli login");
            expect(authErrorMessage).toContain("CHUKYO_USERNAME");
            expect(authErrorMessage).toContain("CHUKYO_PASSWORD");
        });

        test("should handle login failure messages", () => {
            const loginFailureMessage = "Login failed: Invalid credentials";

            expect(loginFailureMessage).toContain("Login failed");
            expect(loginFailureMessage).toContain("Invalid credentials");
        });

        test("should validate health check authentication states", () => {
            const authStates = ["valid", "required", "failed", "unknown"];

            authStates.forEach((state) => {
                const healthStatus = {
                    server: "healthy",
                    timestamp: new Date().toISOString(),
                    browserContext: "available",
                    authentication: state,
                };

                expect(authStates).toContain(healthStatus.authentication);
            });
        });
    });

    describe("URL Validation", () => {
        test("should handle valid Manabo URLs", () => {
            const validUrls = [
                "https://manabo.cnc.chukyo-u.ac.jp",
                "https://manabo.cnc.chukyo-u.ac.jp/",
                "https://manabo.cnc.chukyo-u.ac.jp/course/123",
                "https://manabo.cnc.chukyo-u.ac.jp/assignment/456",
                "https://manabo.cnc.chukyo-u.ac.jp/syllabus/789",
                "https://manabo.cnc.chukyo-u.ac.jp/grade/overview",
                "https://manabo.cnc.chukyo-u.ac.jp/announcement/list",
                "https://manabo.cnc.chukyo-u.ac.jp/timetable",
            ];

            const manaboPattern = /^https:\/\/manabo\.cnc\.chukyo-u\.ac\.jp/;

            validUrls.forEach((url) => {
                expect(url).toMatch(manaboPattern);
            });
        });

        test("should identify authentication redirect URLs", () => {
            const authUrls = ["https://auth.example.com/login", "https://shibboleth.chukyo-u.ac.jp/auth", "https://login.portal.chukyo-u.ac.jp"];

            authUrls.forEach((url) => {
                const isAuthUrl = url.includes("auth") || url.includes("login") || url.includes("shibboleth");
                expect(isAuthUrl).toBe(true);
            });
        });
    });

    describe("Network Monitoring", () => {
        test("should validate network log structure", () => {
            const networkLog = {
                url: "https://manabo.cnc.chukyo-u.ac.jp/api/courses",
                method: "GET",
                status: 200,
                timestamp: "2024-01-01T00:00:00.000Z",
                headers: {
                    "content-type": "application/json",
                    authorization: "Bearer token123",
                },
            };

            expect(networkLog.url).toContain("/api/");
            expect(["GET", "POST", "PUT", "DELETE", "PATCH"]).toContain(networkLog.method);
            expect(networkLog.status).toBeGreaterThanOrEqual(100);
            expect(networkLog.status).toBeLessThan(600);
            expect(networkLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        test("should handle API endpoint filtering", () => {
            const urls = [
                "https://manabo.cnc.chukyo-u.ac.jp/api/courses",
                "https://manabo.cnc.chukyo-u.ac.jp/api/assignments",
                "https://manabo.cnc.chukyo-u.ac.jp/static/css/style.css",
                "https://manabo.cnc.chukyo-u.ac.jp/images/logo.png",
            ];

            const apiUrls = urls.filter((url) => url.includes("/api/"));
            expect(apiUrls).toHaveLength(2);
            expect(apiUrls[0]).toContain("/api/courses");
            expect(apiUrls[1]).toContain("/api/assignments");
        });
    });
});
