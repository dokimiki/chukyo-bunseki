/* eslint-disable functional/no-class */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./packages/playwright-worker/src",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: "https://manabo.cnc.chukyo-u.ac.jp",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],
    webServer: {
        command: "bun run --filter @chukyo-bunseki/mcp-service dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
    },
});
