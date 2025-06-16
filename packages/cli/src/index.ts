#!/usr/bin/env bun
/* eslint-disable functional/no-class */

import { command, run, string, option, subcommands, flag } from "cmd-ts";
import { generateRequirements, generateBatchRequirements } from "@chukyo-bunseki/requirements-agent/src/agent.js";

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
            description: "Analyze multiple URLs from stdin",
        }),
    },
    handler: async ({ url, output, batch }) => {
        try {
            if (batch) {
                console.log("📚 Starting batch analysis...");
                console.log("Enter URLs (one per line), press Ctrl+D when done:");

                const urls: string[] = [];
                for await (const line of console) {
                    const trimmed = line.trim();
                    if (trimmed) {
                        urls.push(trimmed);
                    }
                }

                if (urls.length === 0) {
                    console.error("❌ No URLs provided");
                    process.exit(1);
                }

                console.log(`🔍 Analyzing ${urls.length} URLs...`);
                const results = await generateBatchRequirements(urls);

                const markdown = results
                    .map((result, index) => {
                        if (result.error) {
                            return `## ${index + 1}. ${result.url}\n\n❌ **Error:** ${result.error}\n`;
                        }
                        return `## ${index + 1}. ${result.url}\n\n${result.requirements.markdown}\n`;
                    })
                    .join("\n---\n\n");

                if (output) {
                    await Bun.write(output, markdown);
                    console.log(`✅ Batch analysis saved to ${output}`);
                } else {
                    console.log("\n" + markdown);
                }
            } else {
                if (!url) {
                    console.error("❌ URL is required for single analysis");
                    process.exit(1);
                }

                console.log(`🔍 Analyzing ${url}...`);
                const result = await generateRequirements({ screenUrl: url });

                if (output) {
                    await Bun.write(output, result.markdown);
                    console.log(`✅ Analysis saved to ${output}`);
                } else {
                    console.log("\n" + result.markdown);
                }

                if (result.manaboAnalysis) {
                    console.log("\n🔧 MCP Analysis Summary:");
                    console.log(`- Page Type: ${result.manaboAnalysis.pageType}`);
                    console.log(`- Actions: ${result.manaboAnalysis.structure.actions.length}`);
                    console.log(`- Data Elements: ${result.manaboAnalysis.structure.dataElements.length}`);
                }
            }
        } catch (error) {
            console.error("❌ Analysis failed:", error);
            process.exit(1);
        }
    },
});

const screenshotCommand = command({
    name: "screenshot",
    description: "Take screenshot via MCP service",
    args: {},
    handler: async () => {
        console.log("Taking screenshot...");
        // TODO: Implement MCP service call
    },
});

const app = subcommands({
    name: "chukyo-cli",
    description: "Chukyo University analysis tools with MCP service integration",
    cmds: {
        login: loginCommand,
        analyze: analyzeCommand,
        screenshot: screenshotCommand,
    },
});

run(app, process.argv.slice(2));
