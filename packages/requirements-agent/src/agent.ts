/* eslint-disable functional/no-class */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ManaboPageAnalysis,
  ManaboPageType,
  ManaboPageStructure,
  ManaboAction,
  ManaboDataElement,
  ManaboNavigation,
} from "@chukyo-bunseki/mcp-service/src/types/manabo.js";
import { createAuthenticatedContext } from "@chukyo-bunseki/playwright-worker";
import type { Page } from "playwright";

export interface RequirementsInput {
    screenUrl: string;
    domContent?: string; // Optional HTML content if already retrieved
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
 * Detect Manabo page type based on URL and title
 */
function detectPageType(url: string, title: string): ManaboPageType {
    if (url.includes('/course/') || title.includes('科目') || title.includes('Course')) {
        return ManaboPageType.COURSES;
    }
    if (url.includes('/assignment') || title.includes('課題') || title.includes('Assignment')) {
        return ManaboPageType.ASSIGNMENTS;
    }
    if (url.includes('/syllabus') || title.includes('シラバス') || title.includes('Syllabus')) {
        return ManaboPageType.SYLLABUS;
    }
    if (url.includes('/grade') || title.includes('成績') || title.includes('Grade')) {
        return ManaboPageType.GRADES;
    }
    if (url.includes('/announcement') || title.includes('お知らせ') || title.includes('連絡')) {
        return ManaboPageType.ANNOUNCEMENTS;
    }
    if (url.includes('/timetable') || title.includes('時間割') || title.includes('Time')) {
        return ManaboPageType.TIMETABLE;
    }
    if (url === 'https://manabo.cnc.chukyo-u.ac.jp' || url.includes('/top') || title.includes('ホーム')) {
        return ManaboPageType.TOP;
    }
    return ManaboPageType.OTHER;
}

async function extractActions(page: Page, pageType: ManaboPageType): Promise<ManaboAction[]> {
    return await page.evaluate(() => {
        const actions: any[] = [];
        const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons.forEach((button, index) => {
            const text = button.textContent?.trim() || `Submit button ${index + 1}`;
            actions.push({
                type: 'click',
                selector: `button[type="submit"]:nth-of-type(${index + 1}), input[type="submit"]:nth-of-type(${index + 1})`,
                description: `Submit action: ${text}`,
                required: true,
            });
        });
        return actions;
    }, pageType);
}

async function extractDataElements(page: Page): Promise<ManaboDataElement[]> {
    return await page.evaluate(() => {
        const dataElements: any[] = [];
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach((heading, index) => {
            const text = heading.textContent?.trim() || '';
            if (text) {
                dataElements.push({
                    type: 'text',
                    selector: `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
                    description: `Page heading: ${text.substring(0, 50)}`,
                    example: text.substring(0, 100),
                });
            }
        });
        return dataElements;
    });
}

async function extractNavigation(page: Page): Promise<ManaboNavigation[]> {
    return await page.evaluate(() => {
        const navigation: any[] = [];
        const navLinks = document.querySelectorAll('nav a, .navigation a, .nav-menu a');
        navLinks.forEach((link) => {
            const text = link.textContent?.trim() || '';
            const href = link.getAttribute('href') || '';
            if (text && href) {
                navigation.push({
                    label: text,
                    selector: `a[href="${href}"]`,
                    url: href,
                    description: `Navigate to ${text}`,
                });
            }
        });
        return navigation;
    });
}

async function analyzePageStructure(page: Page, pageType: ManaboPageType): Promise<ManaboPageStructure> {
    const commonSelectors = await page.evaluate(() => {
        const selectors: Record<string, string> = {};
        if (document.querySelector('nav') || document.querySelector('.navigation')) {
            selectors.navigation = 'nav, .navigation, .nav-menu';
        }
        if (document.querySelector('header') || document.querySelector('.header')) {
            selectors.header = 'header, .header, .page-header';
        }
        if (document.querySelector('main') || document.querySelector('.main-content')) {
            selectors.mainContent = 'main, .main-content, .content-area';
        }
        if (document.querySelector('footer') || document.querySelector('.footer')) {
            selectors.footer = 'footer, .footer';
        }
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
            selectors.forms = 'form';
        }
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        if (buttons.length > 0) {
            selectors.buttons = 'button, input[type="button"], input[type="submit"]';
        }
        const links = document.querySelectorAll('a[href]');
        if (links.length > 0) {
            selectors.links = 'a[href]';
        }
        return selectors;
    });

    const actions = await extractActions(page, pageType);
    const dataElements = await extractDataElements(page);
    const navigation = await extractNavigation(page);

    return {
        selectors: commonSelectors,
        actions,
        dataElements,
        navigation,
    };
}

async function analyzeManaboPage(url: string, includeScreenshot = false, includeDOM = true): Promise<ManaboPageAnalysis> {
    const context = await createAuthenticatedContext();
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForTimeout(2000);

    const title = await page.title();
    const pageType = detectPageType(url, title);

    let screenshot: string | undefined;
    if (includeScreenshot) {
        const buffer = await page.screenshot({ fullPage: true, type: 'png' });
        screenshot = buffer.toString('base64');
    }

    let domContent: string | undefined;
    if (includeDOM) {
        domContent = await page.content();
    }

    const structure = await analyzePageStructure(page, pageType);

    await page.close();
    await context.close();

    return {
        url,
        title,
        pageType,
        structure,
        screenshot,
        domContent,
        timestamp: new Date().toISOString(),
    };
}

/**

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
 * Generate requirements documentation using Playwright and Gemini AI
 */
export async function generateRequirements(input: RequirementsInput, apiKey?: string): Promise<RequirementsOutput> {
    const key = apiKey || process.env.GOOGLE_AI_API_KEY;

    if (!key) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }

    try {
        // Analyze page using Playwright
        const analysis = await analyzeManaboPage(input.screenUrl, false, true);

        // Use the DOM content from analysis or fallback to input
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
    }
}

/**
 * Generate requirements for a batch of URLs
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
 * Enhanced cache implementation with analysis data
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
