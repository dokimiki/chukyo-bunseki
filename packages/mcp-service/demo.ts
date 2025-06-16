#!/usr/bin/env bun
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Demo script for testing the MCP Service functionality
 * Tests both Express API endpoints and MCP server tools
 */

import { ManaboPageType } from "./src/types/manabo.js";

// Demo URLs for testing
const DEMO_URLS = {
    top: "https://manabo.cnc.chukyo-u.ac.jp",
    courses: "https://manabo.cnc.chukyo-u.ac.jp/courses",
    assignments: "https://manabo.cnc.chukyo-u.ac.jp/assignments",
};

/**
 * Test Express API endpoints
 */
async function testExpressAPI(): Promise<void> {
    console.log("\n=== Testing Express API ===");

    const baseURL = "http://localhost:3000";

    try {
        // Test health endpoint
        console.log("✅ Testing health endpoint...");
        const healthResponse = await fetch(`${baseURL}/health`);
        const healthData = await healthResponse.json();
        console.log("Health status:", healthData.status);

        // Test analysis endpoint (without screenshot for speed)
        console.log("✅ Testing analysis endpoint...");
        const analysisResponse = await fetch(`${baseURL}/analyze?url=${encodeURIComponent(DEMO_URLS.top)}&screenshot=false&dom=true`);
        const analysisData = await analysisResponse.json();

        if (analysisData.success) {
            console.log("Analysis successful!");
            console.log("Page type:", analysisData.analysis.pageType);
            console.log("Selectors found:", Object.keys(analysisData.analysis.structure.selectors).length);
            console.log("Actions found:", analysisData.analysis.structure.actions.length);
            console.log("Data elements found:", analysisData.analysis.structure.dataElements.length);
        } else {
            console.log("Analysis failed:", analysisData.error);
        }

        // Test screenshot endpoint
        console.log("✅ Testing screenshot endpoint...");
        const screenshotResponse = await fetch(`${baseURL}/screenshot?url=${encodeURIComponent(DEMO_URLS.top)}`);
        if (screenshotResponse.ok) {
            console.log("Screenshot captured successfully");
            console.log("Response size:", screenshotResponse.headers.get("content-length"), "bytes");
        } else {
            console.log("Screenshot failed");
        }
    } catch (error) {
        console.error("Express API test failed:", error);
        console.log("❌ Make sure the Express server is running: bun dev");
    }
}

/**
 * Test different page types analysis
 */
async function testPageTypeDetection(): Promise<void> {
    console.log("\n=== Testing Page Type Detection ===");

    const testCases = [
        { url: DEMO_URLS.top, expected: ManaboPageType.TOP },
        { url: DEMO_URLS.courses, expected: ManaboPageType.COURSES },
        { url: DEMO_URLS.assignments, expected: ManaboPageType.ASSIGNMENTS },
    ];

    const baseURL = "http://localhost:3000";

    for (const testCase of testCases) {
        try {
            console.log(`Testing: ${testCase.url}`);

            const response = await fetch(`${baseURL}/analyze?url=${encodeURIComponent(testCase.url)}&screenshot=false&dom=false`);
            const data = await response.json();

            if (data.success) {
                const detected = data.analysis.pageType;
                const match = detected === testCase.expected;
                console.log(`  Expected: ${testCase.expected}, Detected: ${detected} ${match ? "✅" : "❌"}`);
            } else {
                console.log(`  Failed to analyze: ${data.error}`);
            }
        } catch (error) {
            console.log(`  Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}

/**
 * Test MCP Server tools (simulated - normally would use MCP client)
 */
async function testMCPServerTools(): Promise<void> {
    console.log("\n=== Testing MCP Server Tools (Simulation) ===");

    console.log("Available MCP tools:");
    console.log("1. analyze_manabo_page - Full page analysis with selectors and structure");
    console.log("2. take_screenshot - Full page screenshot capture");
    console.log("3. get_page_dom - HTML DOM content extraction");
    console.log("4. monitor_network - Network request monitoring (XHR/API calls)");

    console.log("\n📋 MCP Tool Examples:");
    console.log("# Full page analysis");
    console.log("analyze_manabo_page({ url: 'https://manabo.cnc.chukyo-u.ac.jp', includeScreenshot: true, includeDOM: true })");

    console.log("\n# Screenshot only");
    console.log("take_screenshot({ url: 'https://manabo.cnc.chukyo-u.ac.jp' })");

    console.log("\n# DOM content only");
    console.log("get_page_dom({ url: 'https://manabo.cnc.chukyo-u.ac.jp' })");

    console.log("\n# Network monitoring");
    console.log("monitor_network({ url: 'https://manabo.cnc.chukyo-u.ac.jp', waitTime: 3000 })");

    console.log("\n💡 To test MCP server:");
    console.log("1. Start MCP server: bun dev:mcp");
    console.log("2. Use MCP client to connect and invoke tools");
    console.log("3. MCP server runs on stdio transport (not HTTP)");
}

/**
 * Display usage examples
 */
function showUsageExamples(): void {
    console.log("\n=== Usage Examples ===");

    console.log("\n📱 Express API Examples:");
    console.log("# Get page analysis (recommended for AI)");
    console.log('curl "http://localhost:3000/analyze?url=https://manabo.cnc.chukyo-u.ac.jp&screenshot=true"');
    console.log("");
    console.log("# Get only screenshot");
    console.log('curl "http://localhost:3000/screenshot?url=https://manabo.cnc.chukyo-u.ac.jp" > manabo.png');
    console.log("");
    console.log("# Get DOM content");
    console.log('curl "http://localhost:3000/dom?url=https://manabo.cnc.chukyo-u.ac.jp" > manabo.html');

    console.log("\n🤖 AI Integration Examples:");
    console.log("# For Claude/ChatGPT with vision");
    console.log("GET /analyze?url=<manabo-url>&screenshot=true&dom=false");
    console.log("");
    console.log("# For text-based AI analysis");
    console.log("GET /analyze?url=<manabo-url>&screenshot=false&dom=true");
    console.log("");
    console.log("# For comprehensive analysis");
    console.log("GET /analyze?url=<manabo-url>&screenshot=true&dom=true");

    console.log("\n🔧 MCP Server:");
    console.log("# Start MCP server");
    console.log("bun dev:mcp");
    console.log("");
    console.log("# Use from MCP client");
    console.log("Tool: analyze_manabo_page");
    console.log('Args: { "url": "https://manabo.cnc.chukyo-u.ac.jp", "includeScreenshot": true }');
}

/**
 * Main demo function
 */
async function main(): Promise<void> {
    console.log("🏫 Chukyo Manabo MCP Service Demo");
    console.log("================================");

    // Show usage examples first
    showUsageExamples();

    // Test if we have required environment variables
    if (!process.env.CHUKYO_USERNAME || !process.env.CHUKYO_PASSWORD) {
        console.log("\n⚠️  Note: CHUKYO_USERNAME and CHUKYO_PASSWORD not set");
        console.log("   Some functionality may require authentication");
    }

    // Check if Express server is running
    try {
        const response = await fetch("http://localhost:3000/health");
        if (response.ok) {
            console.log("\n✅ Express server detected at http://localhost:3000");

            // Run Express API tests
            await testExpressAPI();
            await testPageTypeDetection();
        } else {
            console.log("\n❌ Express server not responding at http://localhost:3000");
        }
    } catch (error) {
        console.log("\n❌ Express server not running at http://localhost:3000");
        console.log("   Start with: bun dev");
    }

    // Show MCP server information
    await testMCPServerTools();

    console.log("\n🏁 Demo completed");
    console.log("\nNext steps:");
    console.log("1. Start Express server: bun dev");
    console.log("2. Start MCP server: bun dev:mcp");
    console.log("3. Use /analyze endpoint to get structured page information for AI");
}

if (import.meta.main) {
    main().catch(console.error);
}
