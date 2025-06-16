/* eslint-disable functional/no-class */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface RequirementsInput {
    screenUrl: string;
    domContent: string;
    networkLogs?: any[];
}

export interface RequirementsOutput {
    markdown: string;
}

export interface ChunkOptions {
    maxChunkSize?: number;
    overlap?: number;
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
 * Generate requirements documentation using Gemini AI
 */
export async function generateRequirements(input: RequirementsInput, apiKey?: string): Promise<RequirementsOutput> {
    const key = apiKey || process.env.GOOGLE_AI_API_KEY;

    if (!key) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }

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

    try {
        // Handle large DOM content by chunking
        const domChunks = chunkContent(input.domContent);
        let analysisResults: string[] = [];

        // Process each chunk
        for (let index = 0; index < domChunks.length; index++) {
            const chunk = domChunks[index];
            const prompt = `
Analyze this Chukyo University web portal page and generate requirements documentation.

URL: ${input.screenUrl}
DOM Content (Part ${index + 1}/${domChunks.length}):
${chunk}

${input.networkLogs ? `Network API Calls: ${JSON.stringify(input.networkLogs, null, 2)}` : ""}

Please analyze this page and respond in JSON format with:
{
  "markdown": "Requirements documentation in markdown format with:
    - ### Screen Name heading
    - Table of main selectors and their purposes
    - List of key functionality
    - API endpoints discovered (if any)
    - User interaction patterns"
}

Focus on extracting actionable requirements for automation and testing.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            try {
                const parsed = JSON.parse(text);
                analysisResults.push(parsed.markdown || text);
            } catch {
                // If not valid JSON, use the text directly
                analysisResults.push(text);
            }
        }

        // Combine results from multiple chunks
        const combinedMarkdown = analysisResults.join("\n\n---\n\n");

        // If multiple chunks, generate a summary
        if (domChunks.length > 1) {
            const summaryPrompt = `
Combine and summarize these analysis results into a single cohesive requirements document:

${combinedMarkdown}

Respond in JSON format:
{
  "markdown": "Final consolidated requirements documentation"
}
`;

            const summaryResult = await model.generateContent(summaryPrompt);
            const summaryResponse = await summaryResult.response;
            const summaryText = summaryResponse.text();

            try {
                const parsed = JSON.parse(summaryText);
                return { markdown: parsed.markdown || summaryText };
            } catch {
                return { markdown: summaryText };
            }
        }

        return { markdown: combinedMarkdown };
    } catch (error) {
        throw new Error(`Gemini AI request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Cache implementation for 24h DOM hash-based caching
 */
export class RequirementsCache {
    private cache = new Map<string, { data: RequirementsOutput; timestamp: number }>();
    private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

    private generateHash(input: RequirementsInput): string {
        const content = `${input.screenUrl}:${input.domContent}`;
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
