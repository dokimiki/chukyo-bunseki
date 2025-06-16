#!/usr/bin/env bun
/* eslint-disable functional/no-class */

import { command, run, string, option, subcommands, flag, boolean } from "cmd-ts";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { generateRequirements, generateBatchRequirements, requirementsCache } from "@chukyo-bunseki/requirements-agent/src/agent.js";

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(resolve(filePath));
    try {
        await mkdir(dir, { recursive: true });
    } catch (error) {
        // Directory might already exist, ignore error
    }
}

const loginCommand = command({
    name: "login",
    description: "Login to Chukyo Manabo/ALBO and save session state",
    args: {
        username: option({
            type: string,
            long: "username",
            short: "u",
            description: "Student ID",
            env: "CHUKYO_USERNAME",
        }),
        password: option({
            type: string,
            long: "password",
            short: "p",
            description: "Password",
            env: "CHUKYO_PASSWORD",
        }),
    },
    handler: async ({ username, password }) => {
        console.log("Starting login process...");
        // TODO: Implement Playwright login logic
        console.log(`Username: ${username ? "[PROVIDED]" : "[NOT PROVIDED]"}`);
        console.log(`Password: ${password ? "[PROVIDED]" : "[NOT PROVIDED]"}`);
    },
});

const analyzeCommand = command({
    name: "analyze",
    description: "Analyze Manabo page and generate requirements documentation via MCP service",
    args: {
        url: option({
            type: string,
            long: "url",
            short: "u",
            description: "Manabo page URL to analyze",
        }),
        output: option({
            type: string,
            long: "output",
            short: "o",
            description: "Output file path for markdown results",
        }),
        batch: flag({
            long: "batch",
            description: "Analyze multiple URLs from stdin or file",
        }),
        batchFile: option({
            type: string,
            long: "batch-file",
            short: "f",
            description: "File containing URLs to analyze (one per line)",
        }),
        apiKey: option({
            type: string,
            long: "api-key",
            short: "k",
            description: "Google AI API key (or use GOOGLE_AI_API_KEY env var)",
            env: "GOOGLE_AI_API_KEY",
        }),
        cache: flag({
            long: "no-cache",
            description: "Disable cache for this analysis",
        }),
        verbose: flag({
            long: "verbose",
            short: "v",
            description: "Enable verbose output",
        }),
    },
    handler: async ({ url, output, batch, batchFile, apiKey, cache, verbose }) => {
        try {
            // Clear cache if no-cache flag is set
            if (cache) {
                requirementsCache.clear();
                if (verbose) console.log("🗑️  Cache cleared");
            }

            if (batch || batchFile) {
                console.log("📚 Starting batch analysis...");

                let urls: string[] = [];

                if (batchFile) {
                    if (!existsSync(batchFile)) {
                        console.error(`❌ File not found: ${batchFile}`);
                        process.exit(1);
                    }
                    const fileContent = await Bun.file(batchFile).text();
                    urls = fileContent
                        .split("\n")
                        .map((line) => line.trim())
                        .filter((line) => line);
                } else {
                    console.log("Enter URLs (one per line), press Ctrl+D when done:");
                    for await (const line of console) {
                        const trimmed = line.trim();
                        if (trimmed) {
                            urls.push(trimmed);
                        }
                    }
                }

                if (urls.length === 0) {
                    console.error("❌ No URLs provided");
                    process.exit(1);
                }

                if (verbose) console.log(`🔍 Analyzing ${urls.length} URLs...`);
                const results = await generateBatchRequirements(urls, apiKey);

                const markdown = results
                    .map((result, index) => {
                        if (result.error) {
                            return `## ${index + 1}. ${result.url}\n\n❌ **Error:** ${result.error}\n`;
                        }
                        return `## ${index + 1}. ${result.url}\n\n${result.requirements.markdown}\n`;
                    })
                    .join("\n---\n\n");

                if (output) {
                    await ensureDirectoryExists(output);
                    await writeFile(output, markdown);
                    console.log(`✅ Batch analysis saved to ${output}`);
                } else {
                    console.log("\n" + markdown);
                }

                if (verbose) {
                    const successCount = results.filter((r) => !r.error).length;
                    console.log(`\n📊 Results: ${successCount}/${urls.length} successful`);
                    console.log(`💾 Cache size: ${requirementsCache.size()}`);
                }
            } else {
                if (!url) {
                    console.error("❌ URL is required for single analysis");
                    process.exit(1);
                }

                if (verbose) console.log(`🔍 Analyzing ${url}...`);
                const result = await generateRequirements({ screenUrl: url }, apiKey);

                if (output) {
                    await ensureDirectoryExists(output);
                    await writeFile(output, result.markdown);
                    console.log(`✅ Analysis saved to ${output}`);
                } else {
                    console.log("\n" + result.markdown);
                }

                if (result.manaboAnalysis && verbose) {
                    console.log("\n🔧 MCP Analysis Summary:");
                    console.log(`- Page Type: ${result.manaboAnalysis.pageType}`);
                    console.log(`- Title: ${result.manaboAnalysis.title}`);
                    console.log(`- Actions: ${result.manaboAnalysis.structure.actions.length}`);
                    console.log(`- Data Elements: ${result.manaboAnalysis.structure.dataElements.length}`);
                    console.log(`- Navigation: ${result.manaboAnalysis.structure.navigation.length}`);
                }

                if (verbose) {
                    console.log(`💾 Cache size: ${requirementsCache.size()}`);
                }
            }
        } catch (error) {
            console.error("❌ Analysis failed:", error);
            process.exit(1);
        }
    },
});

const cacheCommand = command({
    name: "cache",
    description: "Manage requirements cache",
    args: {
        clear: flag({
            long: "clear",
            short: "c",
            description: "Clear the cache",
        }),
        info: flag({
            long: "info",
            short: "i",
            description: "Show cache information",
        }),
    },
    handler: async ({ clear, info }) => {
        if (clear) {
            requirementsCache.clear();
            console.log("✅ Cache cleared");
        } else if (info) {
            console.log(`📊 Cache Information:`);
            console.log(`- Size: ${requirementsCache.size()} entries`);
            console.log(`- TTL: 24 hours`);
        } else {
            console.log("📦 Cache management commands:");
            console.log("  --clear, -c    Clear the cache");
            console.log("  --info, -i     Show cache information");
        }
    },
});

const validateCommand = command({
    name: "validate",
    description: "Validate environment and configuration",
    args: {
        verbose: flag({
            long: "verbose",
            short: "v",
            description: "Enable verbose output",
        }),
    },
    handler: async ({ verbose }) => {
        console.log("🔍 Validating environment...");

        let allValid = true;

        // Check API key
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (apiKey) {
            console.log("✅ Google AI API key: Found");
            if (verbose) {
                console.log(`   Key length: ${apiKey.length} characters`);
            }
        } else {
            console.log("❌ Google AI API key: Not found (set GOOGLE_AI_API_KEY)");
            allValid = false;
        }

        // Check Bun version
        try {
            const bunVersion = await Bun.version;
            console.log(`✅ Bun version: ${bunVersion}`);
        } catch (error) {
            console.log("❌ Bun: Not available");
            allValid = false;
        }

        // Check MCP service dependencies
        try {
            const mcpModule = await import("@chukyo-bunseki/mcp-service/src/mcp-server.js");
            console.log("✅ MCP Service: Available");
        } catch (error) {
            console.log("❌ MCP Service: Not available");
            if (verbose) {
                console.log(`   Error: ${error}`);
            }
            allValid = false;
        }

        // Check cache
        console.log(`✅ Cache: ${requirementsCache.size()} entries`);

        if (allValid) {
            console.log("\n🎉 All checks passed! Ready to analyze.");
        } else {
            console.log("\n⚠️  Some issues found. Please fix them before running analysis.");
            process.exit(1);
        }
    },
});

const configCommand = command({
    name: "config",
    description: "Show configuration and help",
    args: {
        examples: flag({
            long: "examples",
            short: "e",
            description: "Show usage examples",
        }),
    },
    handler: async ({ examples }) => {
        if (examples) {
            console.log("📖 Usage Examples:");
            console.log("");
            console.log("# Analyze a single Manabo page");
            console.log("chukyo-cli analyze --url https://manabo.cnc.chukyo-u.ac.jp/ct/page_123");
            console.log("");
            console.log("# Analyze and save to file");
            console.log("chukyo-cli analyze --url https://manabo.cnc.chukyo-u.ac.jp/ct/page_123 --output requirements.md");
            console.log("");
            console.log("# Batch analysis from file");
            console.log("chukyo-cli analyze --batch-file urls.txt --output batch-results.md");
            console.log("");
            console.log("# Interactive batch analysis");
            console.log("chukyo-cli analyze --batch");
            console.log("");
            console.log("# Validate environment");
            console.log("chukyo-cli validate");
            console.log("");
            console.log("# Clear cache");
            console.log("chukyo-cli cache --clear");
            console.log("");
        } else {
            console.log("⚙️  Configuration:");
            console.log(`- API Key: ${process.env.GOOGLE_AI_API_KEY ? "Set" : "Not set"}`);
            console.log(`- Cache size: ${requirementsCache.size()} entries`);
            console.log("");
            console.log("Environment Variables:");
            console.log("- GOOGLE_AI_API_KEY: Google AI API key for requirements generation");
            console.log("");
            console.log("For examples, use: chukyo-cli config --examples");
        }
    },
});

const app = subcommands({
    name: "chukyo-cli",
    description: "Chukyo University analysis tools with MCP service integration",
    cmds: {
        login: loginCommand,
        analyze: analyzeCommand,
        cache: cacheCommand,
        validate: validateCommand,
        config: configCommand,
    },
});

run(app, process.argv.slice(2));
