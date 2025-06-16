/* eslint-disable functional/no-class */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { ManaboPageAnalysis, AnalyzeManaboPageResult, ManaboPageType } from "@chukyo-bunseki/mcp-service/src/types/manabo.js";

export interface RequirementsInput {
    screenUrl: string;
    domContent?: string; // Made optional since we'll get this from MCP
    networkLogs?: any[];
}

export interface RequirementsOutput {
    markdown: string;
    manaboAnalysis?: ManaboPageAnalysis;
}

export interface ChunkOptions {
    maxChunkSize?: number;
    overlap?: number;
}

/**
 * MCP Client for connecting to Manabo analysis service
 */
class ManaboMCPClient {
    private client: Client;
    private transport: StdioClientTransport;
    private isConnected = false;

    constructor() {
        // Find the workspace root from the current file location
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const workspaceRoot = resolve(__dirname, "../../../");
        const mcpServerPath = join(workspaceRoot, "packages/mcp-service/dist/mcp-server.js");

        this.transport = new StdioClientTransport({
            command: "bun",
            args: ["run", mcpServerPath],
        });
        this.client = new Client(
            {
                name: "requirements-agent",
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        await this.client.connect(this.transport);
        this.isConnected = true;
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected) return;

        await this.client.close();
        this.isConnected = false;
    }

    async analyzePage(url: string, includeScreenshot = false, includeDOM = true): Promise<ManaboPageAnalysis> {
        await this.connect();

        try {
            const result = await this.client.callTool({
                name: "analyze_manabo_page",
                arguments: {
                    url,
                    includeScreenshot,
                    includeDOM,
                },
            });

            if (!result || !result.content || !Array.isArray(result.content)) {
                throw new Error("Invalid response from MCP server");
            }

            const textContent = result.content.find((c: any) => c.type === "text")?.text;
            if (!textContent) {
                throw new Error("No text content found in MCP response");
            }

            const analysisResult: AnalyzeManaboPageResult = JSON.parse(textContent);

            if (!analysisResult.success) {
                throw new Error(analysisResult.error || "Analysis failed");
            }

            if (!analysisResult.analysis) {
                throw new Error("No analysis data returned");
            }

            return analysisResult.analysis;
        } catch (error) {
            throw new Error(`MCP analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}

/**
 * Split large DOM content into chunks for processing
 */
function chunkContent(content: string, options: ChunkOptions = {}): string[] {
    const { maxChunkSize = 200 * 1024, overlap = 1000 } = options; // 200KB default

    if (content.length <= maxChunkSize) {
        return [content];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
        let end = start + maxChunkSize;

        // Try to break at a tag boundary to avoid splitting HTML
        if (end < content.length) {
            const tagEnd = content.lastIndexOf(">", end);
            if (tagEnd > start + maxChunkSize / 2) {
                end = tagEnd + 1;
            }
        }

        chunks.push(content.slice(start, end));
        start = end - overlap;
    }

    return chunks;
}

/**
 * Generate requirements documentation using MCP service and Gemini AI
 */
export async function generateRequirements(input: RequirementsInput, apiKey?: string): Promise<RequirementsOutput> {
    const key = apiKey || process.env.GOOGLE_AI_API_KEY;

    if (!key) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }

    const mcpClient = new ManaboMCPClient();

    try {
        // Get Manabo page analysis from MCP service
        const analysis = await mcpClient.analyzePage(input.screenUrl, false, true);

        // Use the DOM content from MCP analysis or fallback to input
        const domContent = analysis.domContent || input.domContent || "";

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            },
        });

        // Create enhanced prompt with Manabo analysis
        const prompt = `
Analyze this Chukyo University Manabo portal page and generate comprehensive requirements documentation.

URL: ${input.screenUrl}
Page Type: ${analysis.pageType}
Page Title: ${analysis.title}

Manabo Structure Analysis:
- Selectors: ${JSON.stringify(analysis.structure.selectors, null, 2)}
- Actions: ${JSON.stringify(analysis.structure.actions, null, 2)}
- Data Elements: ${JSON.stringify(analysis.structure.dataElements, null, 2)}
- Navigation: ${JSON.stringify(analysis.structure.navigation, null, 2)}

${input.networkLogs ? `Network API Calls: ${JSON.stringify(input.networkLogs, null, 2)}` : ""}

${domContent ? `DOM Content: ${domContent.substring(0, 50000)}` : ""}

Please analyze this Manabo page and respond in JSON format with:
{
  "markdown": "Comprehensive requirements documentation in markdown format with:
    - ### ${analysis.title} (${analysis.pageType.toUpperCase()}) heading
    - Executive summary of page purpose and functionality
    - Table of key UI elements with selectors and purposes
    - Detailed list of user interactions and workflows
    - API endpoints and data flows (if discovered)
    - Automation and testing considerations
    - Page-specific business logic and constraints"
}

Focus on creating actionable requirements for development, automation, and testing teams.
Make use of the Manabo-specific analysis data to provide accurate selectors and interaction patterns.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const parsed = JSON.parse(text);
            return {
                markdown: parsed.markdown || text,
                manaboAnalysis: analysis,
            };
        } catch {
            // If not valid JSON, use the text directly
            return {
                markdown: text,
                manaboAnalysis: analysis,
            };
        }
    } catch (error) {
        throw new Error(`Requirements generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
        await mcpClient.disconnect();
    }
}

/**
 * Generate requirements for a batch of URLs using MCP service
 */
export async function generateBatchRequirements(
    urls: string[],
    apiKey?: string
): Promise<Array<{ url: string; requirements: RequirementsOutput; error?: string }>> {
    const results: Array<{ url: string; requirements: RequirementsOutput; error?: string }> = [];

    for (const url of urls) {
        try {
            const requirements = await generateRequirements({ screenUrl: url }, apiKey);
            results.push({ url, requirements });
        } catch (error) {
            results.push({
                url,
                requirements: { markdown: "" },
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return results;
}

/**
 * Enhanced cache implementation with MCP analysis data
 */
export class RequirementsCache {
    private cache = new Map<string, { data: RequirementsOutput; timestamp: number }>();

    private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

    private generateHash(input: RequirementsInput): string {
        const content = `${input.screenUrl}:${input.domContent || ""}`;
        return Bun.hash(content).toString();
    }

    get(input: RequirementsInput): RequirementsOutput | null {
        const hash = this.generateHash(input);
        const cached = this.cache.get(hash);

        if (!cached || Date.now() - cached.timestamp > this.TTL) {
            if (cached) {
                this.cache.delete(hash);
            }
            return null;
        }

        return cached.data;
    }

    set(input: RequirementsInput, output: RequirementsOutput): void {
        const hash = this.generateHash(input);
        this.cache.set(hash, {
            data: output,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Export singleton cache instance
export const requirementsCache = new RequirementsCache();
