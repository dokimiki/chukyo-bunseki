#!/usr/bin/env bun
import { command, run, string, option, subcommands, flag, optional } from "cmd-ts";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { generateRequirements, generateBatchRequirements, requirementsCache } from "@chukyo-bunseki/requirements-agent/src/agent.js";
import { loginToChukyo, createAutomationWorker } from "@chukyo-bunseki/playwright-worker";

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(resolve(filePath));
    try {
        await mkdir(dir, { recursive: true });
    } catch {
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
        console.log("🔐 Starting login process...");

        if (!username || !password) {
            console.error("❌ Both username and password are required");
            console.error("Usage: ./chukyo-cli login -u <username> -p <password>");
            process.exit(1);
        }

        try {
            const result = await loginToChukyo({ username, password });

            if (result.success) {
                console.log("✅ Login successful!");
                console.log(`📁 Session state saved to: ${result.stateFile || "state.json"}`);
                console.log("🎯 You can now run analysis commands");
            } else {
                console.error(`❌ Login failed: ${result.message}`);
                process.exit(1);
            }
        } catch (error) {
            console.error(`❌ Login error: ${error instanceof Error ? error.message : "Unknown error"}`);
            process.exit(1);
        }
    },
});

const analyzeCommand = command({
    name: "analyze",
    description: "Analyze Manabo page and generate requirements documentation via MCP service",
    args: {
        url: option({
            type: optional(string),
            long: "url",
            short: "u",
            description: "Manabo page URL to analyze (required for single analysis)",
        }),
        output: option({
            type: optional(string),
            long: "output",
            short: "o",
            description: "Output file path for markdown results",
        }),
        batch: flag({
            long: "batch",
            description: "Analyze multiple URLs from stdin or file",
        }),
        batchFile: option({
            type: optional(string),
            long: "batch-file",
            short: "f",
            description: "File containing URLs to analyze (one per line)",
        }),
        apiKey: option({
            type: optional(string),
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
                    console.log("❌ URL is required for single analysis");
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
        process.exit(0);
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
        } catch {
            console.log("❌ Bun: Not available");
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
            console.log("# Extract HTML structure");
            console.log("chukyo-cli html --url https://manabo.cnc.chukyo-u.ac.jp/ct/page_123 --output page.html");
            console.log("");
            console.log("# Extract specific element HTML");
            console.log("chukyo-cli html --url https://manabo.cnc.chukyo-u.ac.jp/ct/page_123 --selector 'main' --format pretty");
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

const htmlCommand = command({
    name: "html",
    description: "Extract HTML structure from a Manabo page",
    args: {
        url: option({
            type: string,
            long: "url",
            short: "u",
            description: "Manabo page URL to extract HTML from",
        }),
        output: option({
            type: optional(string),
            long: "output",
            short: "o",
            description: "Output file path for HTML results",
        }),
        selector: option({
            type: optional(string),
            long: "selector",
            short: "s",
            description: "CSS selector to extract specific element (default: full page)",
        }),
        format: option({
            type: optional(string),
            long: "format",
            short: "f",
            description: "Output format: html, dom, pretty (default: html)",
        }),
        verbose: flag({
            long: "verbose",
            short: "v",
            description: "Enable verbose output",
        }),
    },
    handler: async ({ url, output, selector, format, verbose }) => {
        if (!url) {
            console.error("❌ URL is required");
            process.exit(1);
        }

        try {
            if (verbose) console.log(`🌐 Connecting to ${url}...`);

            const worker = await createAutomationWorker({
                headless: true,
                timeout: 30000,
            });

            const result = await worker.navigateTo(url);

            if (!result.success) {
                console.error(`❌ Failed to navigate to ${url}: ${result.message}`);
                process.exit(1);
            }

            let htmlContent: string;

            if (selector) {
                const elementHTML = await worker.getHTML(selector);
                if (!elementHTML) {
                    console.error(`❌ Element with selector "${selector}" not found`);
                    await worker.cleanup();
                    process.exit(1);
                }
                htmlContent = elementHTML;
            } else {
                const pageHTML = await worker.getPageHTML();
                if (!pageHTML) {
                    console.error("❌ Failed to extract page HTML");
                    await worker.cleanup();
                    process.exit(1);
                }
                htmlContent = pageHTML;
            }

            // Format the output based on format option
            let formattedContent = htmlContent;
            if (format === "pretty") {
                // Basic HTML formatting (could be enhanced with a proper formatter)
                formattedContent = htmlContent.replace(/></g, ">\n<").replace(/^/gm, "  ").trim();
            }

            if (output) {
                await ensureDirectoryExists(output);
                await writeFile(output, formattedContent);
                console.log(`✅ HTML saved to ${output}`);

                if (verbose) {
                    const stats = {
                        size: formattedContent.length,
                        lines: formattedContent.split("\n").length,
                        elements: (formattedContent.match(/<[^/][^>]*>/g) || []).length,
                    };
                    console.log(`📊 File stats: ${stats.size} bytes, ${stats.lines} lines, ${stats.elements} elements`);
                }
            } else {
                console.log("\n" + formattedContent);
            }

            await worker.cleanup();
        } catch (error) {
            console.error("❌ HTML extraction failed:", error instanceof Error ? error.message : "Unknown error");
            process.exit(1);
        }
    },
});

const app = subcommands({
    name: "chukyo-cli",
    description: "Chukyo University analysis tools with requirements analysis and HTML extraction capabilities",
    cmds: {
        login: loginCommand,
        analyze: analyzeCommand,
        cache: cacheCommand,
        validate: validateCommand,
        config: configCommand,
        html: htmlCommand,
    },
});

run(app, process.argv.slice(2));
