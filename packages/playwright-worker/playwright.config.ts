import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Test configuration for Chukyo University portal testing
 */
export default defineConfig({
    // Test directory
    testDir: "./__tests__",

    // Run tests in files in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: "html",

    // Global setup and teardown
    globalSetup: undefined,
    globalTeardown: undefined,

    // Shared settings for all the projects below
    use: {
        // Base URL to use in actions like `await page.goto('/')`
        baseURL: "https://manabo.cnc.chukyo-u.ac.jp",

        // Collect trace when retrying the failed test
        trace: "on-first-retry",

        // Take screenshot on failure
        screenshot: "only-on-failure",

        // Record video on failure
        video: "retain-on-failure",

        // Browser context options
        locale: "ja-JP",
        timezoneId: "Asia/Tokyo",

        // Ignore HTTPS errors
        ignoreHTTPSErrors: true,

        // Timeout for each action
        actionTimeout: 10000,

        // Timeout for navigation
        navigationTimeout: 30000,
    },

    // Configure projects for major browsers
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },

        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },

        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },

        // Test against mobile viewports
        {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
        },
        {
            name: "Mobile Safari",
            use: { ...devices["iPhone 12"] },
        },

        // Test against branded browsers
        {
            name: "Microsoft Edge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
        },
        {
            name: "Google Chrome",
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
        },
    ],

    // Run your local dev server before starting the tests
    webServer: undefined,

    // Timeout for the entire test run
    timeout: 60000,

    // Expect timeout for assertions
    expect: {
        timeout: 10000,
    },

    // Output directory for test results
    outputDir: "test-results/",

    // Whether to preserve output directory
    preserveOutput: "failures-only",
});
