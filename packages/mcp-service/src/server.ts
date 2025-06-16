import express from "express";
import compression from "compression";
import cors from "cors";
import { createAuthenticatedContext } from "@chukyo-bunseki/playwright-worker";
import { type ManaboPageAnalysis, ManaboPageType, type ManaboPageStructure } from "./types/manabo";

const app = express();
const PORT = process.env.MCP_PORT || 3000;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Global context for reuse
let globalContext: any = null;

/**
 * Detect the type of Manabo page based on URL and title
 */
function detectPageType(url: string, title: string): ManaboPageType {
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

/**
 * Analyze page structure for AI consumption
 */
async function analyzePageStructure(page: any, pageType: ManaboPageType): Promise<ManaboPageStructure> {
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

    const actions = await page.evaluate((type: ManaboPageType) => {
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

        // Search forms
        const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="検索"]');
        searchInputs.forEach((input, index) => {
            const placeholder = input.getAttribute("placeholder") || "Search input";
            actions.push({
                type: "form",
                selector: `input[type="search"]:nth-of-type(${index + 1}), input[name*="search"]:nth-of-type(${index + 1})`,
                description: `Search functionality: ${placeholder}`,
            });
        });

        return actions;
    }, pageType);

    const dataElements = await page.evaluate(() => {
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

        // Tables
        const tables = document.querySelectorAll("table");
        tables.forEach((table, index) => {
            const caption = table.querySelector("caption")?.textContent?.trim() || `Table ${index + 1}`;
            dataElements.push({
                type: "table",
                selector: `table:nth-of-type(${index + 1})`,
                description: `Data table: ${caption}`,
            });
        });

        return dataElements;
    });

    const navigation = await page.evaluate(() => {
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

    return {
        selectors: commonSelectors,
        actions,
        dataElements,
        navigation,
    };
}

/**
 * GET /screenshot - Take full page screenshot
 */
app.get("/screenshot", async (req, res) => {
    try {
        if (!globalContext) {
            globalContext = await createAuthenticatedContext();
        }

        const page = await globalContext.newPage();
        const url = (req.query.url as string) || "https://manabo.cnc.chukyo-u.ac.jp";

        await page.goto(url);
        const screenshot = await page.screenshot({
            fullPage: true,
            type: "png",
        });

        await page.close();

        res.setHeader("Content-Type", "image/png");
        res.send(screenshot);
    } catch (error) {
        console.error("Screenshot error:", error);
        res.status(500).json({
            error: "Failed to take screenshot",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * GET /dom - Get compressed HTML content
 */
app.get("/dom", async (req, res) => {
    try {
        if (!globalContext) {
            globalContext = await createAuthenticatedContext();
        }

        const page = await globalContext.newPage();
        const url = (req.query.url as string) || "https://manabo.cnc.chukyo-u.ac.jp";

        await page.goto(url);
        const content = await page.content();

        await page.close();

        // Content is automatically compressed by compression middleware
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(content);
    } catch (error) {
        console.error("DOM error:", error);
        res.status(500).json({
            error: "Failed to get DOM",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * GET /network - Get XHR/API call metadata
 */
app.get("/network", async (req, res) => {
    try {
        if (!globalContext) {
            globalContext = await createAuthenticatedContext();
        }

        const page = await globalContext.newPage();
        const networkLogs: any[] = [];

        // Intercept network requests
        page.route("**/api/**", (route: any) => {
            const request = route.request();
            networkLogs.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                timestamp: new Date().toISOString(),
            });
            route.continue();
        });

        const url = (req.query.url as string) || "https://manabo.cnc.chukyo-u.ac.jp";
        await page.goto(url);

        // Wait a bit for XHR calls to complete
        await page.waitForTimeout(2000);

        await page.close();

        res.json({
            networkLogs,
            count: networkLogs.length,
        });
    } catch (error) {
        console.error("Network error:", error);
        res.status(500).json({
            error: "Failed to capture network logs",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * GET /analyze - Analyze Manabo page structure for AI consumption
 */
app.get("/analyze", async (req, res) => {
    try {
        if (!globalContext) {
            globalContext = await createAuthenticatedContext();
        }

        const page = await globalContext.newPage();
        const url = (req.query.url as string) || "https://manabo.cnc.chukyo-u.ac.jp";
        const includeScreenshot = req.query.screenshot === "true";
        const includeDOM = req.query.dom !== "false"; // Default to true

        await page.goto(url);
        await page.waitForTimeout(2000); // Wait for dynamic content

        const title = await page.title();
        const pageType = detectPageType(url, title);

        // Get screenshot if requested
        let screenshot: string | undefined;
        if (includeScreenshot) {
            const screenshotBuffer = await page.screenshot({
                fullPage: true,
                type: "png",
            });
            screenshot = screenshotBuffer.toString("base64");
        }

        // Get DOM content if requested
        let domContent: string | undefined;
        if (includeDOM) {
            domContent = await page.content();
        }

        // Analyze page structure
        const structure = await analyzePageStructure(page, pageType);

        const analysis: ManaboPageAnalysis = {
            url,
            title,
            pageType,
            structure,
            screenshot,
            domContent,
            timestamp: new Date().toISOString(),
        };

        await page.close();

        res.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to analyze page",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
        error: "Internal server error",
        message: error.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`MCP Service running on http://localhost:${PORT}`);
    console.log("Available endpoints:");
    console.log("  GET /screenshot?url=<url>");
    console.log("  GET /dom?url=<url>");
    console.log("  GET /network?url=<url>");
    console.log("  GET /analyze?url=<url>&screenshot=<true|false>&dom=<true|false>");
    console.log("  GET /health");
    console.log("");
    console.log("For MCP server, run: bun dev:mcp");
});

export default app;
