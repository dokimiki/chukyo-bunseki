import { ChkyuoAutomationWorker, PageInfo } from "./automation.js";
import { ChkyuoPortalWorker } from "./portal.js";
import { RequirementsInput, generateRequirements } from "../../requirements-agent/src/agent.js";

export interface PageAnalysisResult {
    pageInfo: PageInfo;
    requirements: string;
    success: boolean;
    message: string;
}

/**
 * Integration worker that combines automation with requirements analysis
 */
export class ChkyuoIntegrationWorker {
    private worker: ChkyuoPortalWorker;

    constructor(private options: { stateFile?: string; geminiApiKey?: string } = {}) {
        this.worker = new ChkyuoPortalWorker(options);
    }

    /**
     * Initialize the integration worker
     */
    async initialize(): Promise<void> {
        await this.worker.initialize();
    }

    /**
     * Navigate to a page and analyze its requirements
     */
    async navigateAndAnalyze(url: string): Promise<PageAnalysisResult> {
        try {
            // Navigate to the page
            const navigationResult = await this.worker.navigateTo(url);
            if (!navigationResult.success || !navigationResult.pageInfo) {
                return {
                    pageInfo: {
                        url,
                        title: "",
                        domContent: "",
                        networkLogs: [],
                    },
                    requirements: "",
                    success: false,
                    message: navigationResult.message,
                };
            }

            // Generate requirements documentation
            const requirementsInput: RequirementsInput = {
                screenUrl: navigationResult.pageInfo.url,
                domContent: navigationResult.pageInfo.domContent,
                networkLogs: navigationResult.pageInfo.networkLogs,
            };

            const requirementsResult = await generateRequirements(requirementsInput, this.options.geminiApiKey);

            return {
                pageInfo: navigationResult.pageInfo,
                requirements: requirementsResult.markdown,
                success: true,
                message: "Successfully analyzed page requirements",
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return {
                pageInfo: {
                    url,
                    title: "",
                    domContent: "",
                    networkLogs: [],
                },
                requirements: "",
                success: false,
                message: `Analysis failed: ${errorMessage}`,
            };
        }
    }

    /**
     * Perform an action and analyze the resulting page
     */
    async actionAndAnalyze(action: () => Promise<any>): Promise<PageAnalysisResult> {
        try {
            // Perform the action
            await action();

            // Get current page info
            const pageInfo = await this.worker.getPageInfo();

            // Generate requirements documentation
            const requirementsInput: RequirementsInput = {
                screenUrl: pageInfo.url,
                domContent: pageInfo.domContent,
                networkLogs: pageInfo.networkLogs,
            };

            const requirementsResult = await generateRequirements(requirementsInput, this.options.geminiApiKey);

            return {
                pageInfo,
                requirements: requirementsResult.markdown,
                success: true,
                message: "Successfully performed action and analyzed requirements",
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const pageInfo = await this.worker.getPageInfo().catch(() => ({
                url: "",
                title: "",
                domContent: "",
                networkLogs: [],
            }));

            return {
                pageInfo,
                requirements: "",
                success: false,
                message: `Action failed: ${errorMessage}`,
            };
        }
    }

    /**
     * Analyze portal top page
     */
    async analyzePortalTop(): Promise<PageAnalysisResult> {
        return await this.actionAndAnalyze(() => this.worker.goToPortalTop());
    }

    /**
     * Get access to the underlying worker for direct operations
     */
    getWorker(): ChkyuoPortalWorker {
        return this.worker;
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        await this.worker.cleanup();
    }
}

/**
 * Convenience function to create and initialize integration worker
 */
export async function createIntegrationWorker(
    options: {
        stateFile?: string;
        geminiApiKey?: string;
    } = {}
): Promise<ChkyuoIntegrationWorker> {
    const worker = new ChkyuoIntegrationWorker(options);
    await worker.initialize();
    return worker;
}
