import { BrowserContext, Page, Locator } from "playwright";
import { createAuthenticatedContext } from "./login.js";
import { envBoolean } from "./utils.js";

export interface AutomationOptions {
    stateFile?: string;
    headless?: boolean;
    slowMo?: number;
    timeout?: number;
}

export interface PageInfo {
    url: string;
    title: string;
    domContent: string;
    networkLogs: any[];
    screenshot?: string;
}

export interface ActionResult {
    success: boolean;
    message: string;
    pageInfo?: PageInfo;
}

/**
 * Web automation worker for Chukyo University portal
 */
export class ChkyuoAutomationWorker {
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private networkLogs: any[] = [];

    constructor(private options: AutomationOptions = {}) {}

    /**
     * Initialize the automation worker with authenticated context
     */
    async initialize(): Promise<void> {
        const envHeadless = envBoolean('HEADLESS', true);
        const { stateFile = "state.json", slowMo = 100, headless = envHeadless } = this.options;

        this.context = await createAuthenticatedContext(stateFile, headless);
        this.page = await this.context.newPage();

        if (slowMo) {
            this.page.setDefaultTimeout(this.options.timeout || 30000);
        }

        // Start collecting network logs
        this.networkLogs = [];
        this.page.on("response", (response) => {
            this.networkLogs.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method(),
                timestamp: Date.now(),
                headers: response.headers(),
            });
        });
    }

    /**
     * Navigate to a specific page
     */
    async navigateTo(url: string): Promise<ActionResult> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            await this.page.goto(url);
            await this.page.waitForLoadState("networkidle");

            const pageInfo = await this.getPageInfo();

            return {
                success: true,
                message: `Successfully navigated to ${url}`,
                pageInfo,
            };
        } catch (error) {
            return {
                success: false,
                message: `Navigation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Click on an element by selector
     */
    async click(selector: string): Promise<ActionResult> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            await this.page.click(selector);
            await this.page.waitForLoadState("networkidle");

            const pageInfo = await this.getPageInfo();

            return {
                success: true,
                message: `Successfully clicked element: ${selector}`,
                pageInfo,
            };
        } catch (error) {
            return {
                success: false,
                message: `Click failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Fill a form field
     */
    async fill(selector: string, value: string): Promise<ActionResult> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            await this.page.fill(selector, value);

            return {
                success: true,
                message: `Successfully filled field: ${selector}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Fill failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Select an option from a dropdown
     */
    async select(selector: string, value: string): Promise<ActionResult> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            await this.page.selectOption(selector, value);

            return {
                success: true,
                message: `Successfully selected option: ${value} in ${selector}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Select failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Wait for an element to be visible
     */
    async waitForElement(selector: string, timeout?: number): Promise<ActionResult> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            await this.page.waitForSelector(selector, {
                timeout: timeout || this.options.timeout || 30000,
            });

            return {
                success: true,
                message: `Element found: ${selector}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Wait failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get text content of an element
     */
    async getText(selector: string): Promise<string | null> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            return await this.page.textContent(selector);
        } catch (error) {
            console.error(`Failed to get text from ${selector}:`, error);
            return null;
        }
    }

    /**
     * Check if an element exists
     */
    async elementExists(selector: string): Promise<boolean> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        try {
            const element = await this.page.$(selector);
            return element !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current page information for requirements analysis
     */
    async getPageInfo(): Promise<PageInfo> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        const url = this.page.url();
        const title = await this.page.title();
        const domContent = await this.page.content();

        // Get screenshot as base64
        const screenshotBuffer = await this.page.screenshot({
            fullPage: true,
            type: "png",
        });
        const screenshot = screenshotBuffer.toString("base64");

        return {
            url,
            title,
            domContent,
            networkLogs: [...this.networkLogs],
            screenshot,
        };
    }

    /**
     * Execute custom JavaScript on the page
     */
    async evaluate<T>(fn: () => T): Promise<T> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        return await this.page.evaluate(fn);
    }

    async getHTML(selector: string): Promise<string | null> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }
        try {
            const element = await this.page.$(selector);
            if (!element) {
                return null;
            }
            return await this.page.evaluate((el) => el.outerHTML, element);
        } catch (error) {
            console.error(`Failed to get HTML from ${selector}:`, error);
            return null;
        }
    }

    async getPageHTML(): Promise<string | null> {
        return this.getHTML("html");
    }

    async getScriptFile(selector: string): Promise<string | null> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }
        try {
            const element = await this.page.$(selector);
            if (!element) {
                return null;
            }
            const src = await this.page.evaluate((el) => el.getAttribute("src"), element);
            if (!src) {
                return null;
            }
            const response = await this.page.goto(src);
            if (!response || !response.ok()) {
                throw new Error(`Failed to fetch script from ${src}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Failed to get script file from ${selector}:`, error);
            return null;
        }
    }

    /**
     * Take a screenshot of the current page
     */
    async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<string> {
        if (!this.page) {
            throw new Error("Worker not initialized. Call initialize() first.");
        }

        const buffer = await this.page.screenshot({
            fullPage: options?.fullPage ?? true,
            type: "png",
            path: options?.path,
        });

        return buffer.toString("base64");
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.context) {
            await this.context.tracing.stop({ path: "automation-trace.zip" });
        }

        await this.page?.close();
        await this.context?.close();

        this.page = null;
        this.context = null;
        this.networkLogs = [];
    }
}

/**
 * Convenience function to create and initialize worker
 */
export async function createAutomationWorker(options: AutomationOptions = {}): Promise<ChkyuoAutomationWorker> {
    const worker = new ChkyuoAutomationWorker(options);
    await worker.initialize();
    return worker;
}
