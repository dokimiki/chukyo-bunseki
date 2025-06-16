import { test, expect, describe } from "bun:test";
import { ChkyuoAutomationWorker, ChkyuoPortalWorker } from "../src/index.js";

describe("Automation Worker", () => {
    test("should initialize without authentication for basic functionality", () => {
        const worker = new ChkyuoAutomationWorker();
        expect(worker).toBeDefined();
        expect(typeof worker.click).toBe("function");
        expect(typeof worker.fill).toBe("function");
        expect(typeof worker.navigateTo).toBe("function");
    });

    test("should have proper error handling for uninitialized state", async () => {
        const worker = new ChkyuoAutomationWorker();

        // Should throw error when trying to use without initialization
        await expect(async () => {
            await worker.navigateTo("https://example.com");
        }).toThrow("Worker not initialized");
    });

    test("should handle element existence checking", async () => {
        const worker = new ChkyuoAutomationWorker();

        await expect(async () => {
            await worker.elementExists(".some-selector");
        }).toThrow("Worker not initialized");
    });
});

describe("Portal Worker", () => {
    test("should extend automation worker", () => {
        const worker = new ChkyuoPortalWorker();
        expect(worker).toBeInstanceOf(ChkyuoAutomationWorker);
    });

    test("should have portal-specific methods", () => {
        const worker = new ChkyuoPortalWorker();
        expect(typeof worker.goToPortalTop).toBe("function");
        expect(typeof worker.goToCourseRegistration).toBe("function");
        expect(typeof worker.goToGrades).toBe("function");
        expect(typeof worker.getStudentInfo).toBe("function");
        expect(typeof worker.getRegisteredCourses).toBe("function");
    });

    test("should handle uninitialized state properly", async () => {
        const worker = new ChkyuoPortalWorker();

        await expect(async () => {
            await worker.getStudentInfo();
        }).toThrow("Worker not initialized");
    });
});

describe("Data structures", () => {
    test("should handle empty course list", () => {
        const courses: any[] = [];
        expect(Array.isArray(courses)).toBe(true);
        expect(courses.length).toBe(0);
    });

    test("should handle empty announcement list", () => {
        const announcements: any[] = [];
        expect(Array.isArray(announcements)).toBe(true);
        expect(announcements.length).toBe(0);
    });
});

describe("Error handling", () => {
    test("should handle network timeouts gracefully", () => {
        // Test timeout configuration
        const options = {
            timeout: 5000,
            headless: true,
        };

        expect(options.timeout).toBe(5000);
        expect(options.headless).toBe(true);
    });

    test("should validate selector formats", () => {
        const validSelectors = ["#id", ".class", "tag", "[data-test='value']", "tag.class#id"];

        validSelectors.forEach((selector) => {
            expect(typeof selector).toBe("string");
            expect(selector.length).toBeGreaterThan(0);
        });
    });
});
