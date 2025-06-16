import express from "express";
import compression from "compression";
import cors from "cors";
import { createAuthenticatedContext } from "@chukyo-bunseki/playwright-worker";

const app = express();
const PORT = process.env.MCP_PORT || 3000;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Global context for reuse
let globalContext: any = null;

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
    console.log("  GET /health");
});

export default app;
