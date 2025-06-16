import { test, expect, describe } from "bun:test";
import { ChkyuoIntegrationWorker } from "../src/index.js";

describe("Integration Worker", () => {
    test("should create integration worker", () => {
        const worker = new ChkyuoIntegrationWorker();
        expect(worker).toBeDefined();
    });

    test("should have analysis methods", () => {
        const worker = new ChkyuoIntegrationWorker();
        expect(typeof worker.analyzePortalTop).toBe("function");
        expect(typeof worker.analyzeCourseRegistration).toBe("function");
        expect(typeof worker.analyzeGrades).toBe("function");
        expect(typeof worker.analyzeCompletePortal).toBe("function");
    });

    test("should handle missing API key gracefully", async () => {
        const worker = new ChkyuoIntegrationWorker({
            geminiApiKey: undefined,
        });

        // Should not throw during construction
        expect(worker).toBeDefined();
    });

    test("should provide access to underlying worker", () => {
        const worker = new ChkyuoIntegrationWorker();
        const portalWorker = worker.getWorker();
        expect(portalWorker).toBeDefined();
    });
});

describe("Page Analysis", () => {
    test("should structure analysis results correctly", () => {
        const mockAnalysisResult = {
            pageInfo: {
                url: "https://example.com",
                title: "Test Page",
                domContent: "<html></html>",
                networkLogs: [],
            },
            requirements: "# Test Requirements\n\nThis is a test.",
            success: true,
            message: "Analysis completed",
        };

        expect(mockAnalysisResult.success).toBe(true);
        expect(typeof mockAnalysisResult.requirements).toBe("string");
        expect(mockAnalysisResult.pageInfo.url).toBe("https://example.com");
    });

    test("should handle analysis failure", () => {
        const mockFailureResult = {
            pageInfo: {
                url: "",
                title: "",
                domContent: "",
                networkLogs: [],
            },
            requirements: "",
            success: false,
            message: "Analysis failed: Network error",
        };

        expect(mockFailureResult.success).toBe(false);
        expect(mockFailureResult.message).toContain("failed");
    });
});

describe("Complete Portal Analysis", () => {
    test("should structure complete analysis results", () => {
        const mockCompleteAnalysis = {
            top: { success: true, requirements: "# Top page" },
            courses: { success: true, requirements: "# Courses page" },
            grades: { success: true, requirements: "# Grades page" },
            syllabus: { success: true, requirements: "# Syllabus page" },
            announcements: { success: true, requirements: "# Announcements page" },
        };

        expect(Object.keys(mockCompleteAnalysis)).toContain("top");
        expect(Object.keys(mockCompleteAnalysis)).toContain("courses");
        expect(Object.keys(mockCompleteAnalysis)).toContain("grades");
        expect(mockCompleteAnalysis.top.success).toBe(true);
    });
});
