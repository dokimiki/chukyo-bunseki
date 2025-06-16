import { chromium, Browser, BrowserContext, Page } from "playwright";
import { envBoolean } from "./utils.js";

export interface LoginOptions {
    username: string;
    password: string;
    headless?: boolean;
    slowMo?: number;
    timeout?: number;
}

export interface LoginResult {
    success: boolean;
    message: string;
    stateFile?: string;
}

/**
 * Login to Chukyo University Shibboleth authentication
 * Saves session state to state.json on success
 */
export async function loginToChukyoManabo(options: LoginOptions): Promise<LoginResult> {
    const envHeadless = envBoolean("HEADLESS", true);
    const { username, password, headless = envHeadless, slowMo = 100, timeout = 30000 } = options;

    // Load state file path from environment or fallback
    const stateFile = process.env.STATE_FILE ?? "state.json";

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
        // Launch browser
        browser = await chromium.launch({
            headless,
            slowMo,
        });

        // Create context with tracing enabled
        context = await browser.newContext();
        await context.tracing.start({
            screenshots: true,
            snapshots: true,
        });

        page = await context.newPage();
        page.setDefaultTimeout(timeout);

        // Navigate to Manabo login
        await page.goto("https://manabo.cnc.chukyo-u.ac.jp/auth/shibboleth/");

        // Wait for Shibboleth login form
        await page.waitForSelector("#username", { timeout });
        await page.waitForSelector("#password", { timeout });

        // Fill credentials
        await page.fill("#username", username);
        await page.fill("#password", password);

        // Submit form
        await page.click("button#login");

        // Wait for successful navigation to manabo.cnc domain
        await page.waitForURL(/manabo\.cnc/, { timeout });

        // Save session state
        await context.storageState({ path: stateFile });

        // Save trace
        await context.tracing.stop({ path: "trace.zip" });

        return {
            success: true,
            message: "Login successful",
            stateFile,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Save trace on error for debugging
        if (context) {
            await context.tracing.stop({ path: "trace-error.zip" });
        }

        return {
            success: false,
            message: `Login failed: ${errorMessage}`,
        };
    } finally {
        // Cleanup
        await page?.close();
        await context?.close();
        await browser?.close();
    }
}

/**
 * Create a new browser context with saved state
 */
export async function createAuthenticatedContext(
    stateFile: string = process.env.STATE_FILE ?? "state.json",
    headless = envBoolean("HEADLESS", true)
): Promise<BrowserContext> {
    // Check if state file exists
    const fs = await import("fs/promises");
    try {
        await fs.access(stateFile);
    } catch (error) {
        throw new Error(
            `Error reading storage state from ${stateFile}:\n${
                error instanceof Error ? error.message : "Unknown error"
            }\n\nPlease run login first using: ./chukyo-cli login -u <username> -p <password>`
        );
    }

    const browser = await chromium.launch({
        headless,
    });

    let context: BrowserContext;
    try {
        context = await browser.newContext({
            storageState: stateFile,
        });
    } catch (error) {
        await browser.close();
        throw new Error(
            `Failed to create context with storage state from ${stateFile}:\n${
                error instanceof Error ? error.message : "Unknown error"
            }\n\nPlease run login first using: ./chukyo-cli login -u <username> -p <password>`
        );
    }

    await context.tracing.start({
        screenshots: true,
        snapshots: true,
    });

    return context;
}
