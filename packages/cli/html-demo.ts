#!/usr/bin/env bun
/**
 * Demo script for the new HTML extraction functionality
 * This demonstrates how to use the chukyo-cli html command
 */

import { $ } from "bun";

async function runDemo() {
    console.log("🌐 Chukyo CLI HTML Extraction Demo");
    console.log("=====================================\n");

    // Show the help for the HTML command
    console.log("📖 1. HTML Command Help:");
    console.log("-------------------------");
    try {
        await $`bun run src/index.ts html --help`;
    } catch {
        console.log("Help displayed above\n");
    }

    console.log("\n📋 2. Usage Examples:");
    console.log("---------------------");

    console.log("Extract full page HTML:");
    console.log("  chukyo-cli html --url 'https://example.com' --output page.html");

    console.log("\nExtract specific element:");
    console.log("  chukyo-cli html --url 'https://example.com' --selector 'main' --output main.html");

    console.log("\nPretty formatted output:");
    console.log("  chukyo-cli html --url 'https://example.com' --format pretty");

    console.log("\nVerbose extraction:");
    console.log("  chukyo-cli html --url 'https://example.com' --verbose");

    console.log("\n🎯 3. Key Features:");
    console.log("-------------------");
    console.log("✅ Full page HTML extraction");
    console.log("✅ CSS selector-based element extraction");
    console.log("✅ Multiple output formats (html, pretty)");
    console.log("✅ File output or console display");
    console.log("✅ Verbose mode with statistics");
    console.log("✅ Authenticated Manabo sessions");

    console.log("\n📝 4. Common Use Cases:");
    console.log("-----------------------");
    console.log("• Extracting course page structure");
    console.log("• Getting assignment form HTML");
    console.log("• Analyzing navigation elements");
    console.log("• Debugging page layouts");
    console.log("• Creating HTML templates");

    console.log("\n🔧 5. Integration with Other Commands:");
    console.log("-------------------------------------");
    console.log("The HTML command complements the analyze command:");
    console.log("• analyze: Generates requirements documentation");
    console.log("• html: Extracts raw HTML structure");
    console.log("• Together: Complete page analysis workflow");

    console.log("\n✨ Demo completed! Try the commands above with real Manabo URLs.");
}

if (import.meta.main) {
    await runDemo();
}
