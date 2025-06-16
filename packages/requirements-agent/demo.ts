#!/usr/bin/env bun
/* eslint-disable functional/no-class */

/**
 * Demo script for requirements-agent with MCP service integration
 */

import { generateRequirements, generateBatchRequirements, requirementsCache } from "./src/agent.js";

async function demoSinglePage(): Promise<void> {
    console.log("🔍 Analyzing single Manabo page...");

    try {
        const result = await generateRequirements({
            screenUrl: "https://manabo.cnc.chukyo-u.ac.jp",
        });

        console.log("\n📊 Analysis Results:");
        console.log("===================");
        console.log(result.markdown.substring(0, 500) + "...");

        if (result.manaboAnalysis) {
            console.log("\n🔧 MCP Analysis Summary:");
            console.log(`- Page Type: ${result.manaboAnalysis.pageType}`);
            console.log(`- Title: ${result.manaboAnalysis.title}`);
            console.log(`- Selectors found: ${Object.keys(result.manaboAnalysis.structure.selectors).length}`);
            console.log(`- Actions found: ${result.manaboAnalysis.structure.actions.length}`);
            console.log(`- Data elements found: ${result.manaboAnalysis.structure.dataElements.length}`);
            console.log(`- Navigation items: ${result.manaboAnalysis.structure.navigation.length}`);
        }
    } catch (error) {
        console.error("❌ Error analyzing page:", error);
    }
}

async function demoBatchAnalysis(): Promise<void> {
    console.log("\n🔍 Batch analyzing multiple Manabo pages...");

    const urls = ["https://manabo.cnc.chukyo-u.ac.jp", "https://manabo.cnc.chukyo-u.ac.jp/course", "https://manabo.cnc.chukyo-u.ac.jp/assignment"];

    try {
        const results = await generateBatchRequirements(urls);

        console.log("\n📊 Batch Analysis Results:");
        console.log("=========================");

        results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.url}`);
            if (result.error) {
                console.log(`   ❌ Error: ${result.error}`);
            } else {
                console.log(`   ✅ Generated ${result.requirements.markdown.length} characters`);
                if (result.requirements.manaboAnalysis) {
                    console.log(`   🔧 Page Type: ${result.requirements.manaboAnalysis.pageType}`);
                }
            }
        });
    } catch (error) {
        console.error("❌ Error in batch analysis:", error);
    }
}

async function demoCaching(): Promise<void> {
    console.log("\n💾 Testing cache functionality...");

    const input = {
        screenUrl: "https://manabo.cnc.chukyo-u.ac.jp",
    };

    console.log(`Cache size before: ${requirementsCache.size()}`);

    // First analysis (will be cached)
    console.log("🔄 First analysis (will cache)...");
    const result1 = await generateRequirements(input);
    console.log(`Cache size after first: ${requirementsCache.size()}`);

    // Second analysis (should use cache)
    console.log("🔄 Second analysis (should use cache)...");
    const cached = requirementsCache.get(input);
    if (cached) {
        console.log("✅ Cache hit! Using cached result");
        console.log(`Cached markdown length: ${cached.markdown.length}`);
    } else {
        console.log("❌ Cache miss - analyzing again");
        const result2 = await generateRequirements(input);
    }
}

async function main(): Promise<void> {
    console.log("🚀 Requirements Agent Demo with MCP Service");
    console.log("============================================");

    // Check for API key
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.error("❌ GOOGLE_AI_API_KEY environment variable is required");
        console.log("💡 Set it with: export GOOGLE_AI_API_KEY=your_api_key");
        process.exit(1);
    }

    try {
        await demoSinglePage();
        await demoBatchAnalysis();
        await demoCaching();

        console.log("\n✅ Demo completed successfully!");
    } catch (error) {
        console.error("💥 Demo failed:", error);
        process.exit(1);
    }
}

if (import.meta.main) {
    main().catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });
}
