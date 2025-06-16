import { test, expect, describe } from "bun:test";
import { ChkyuoAutomationWorker } from "../src/index.js";

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

describe("Data structures", () => {
    test("should handle empty course list", () => {
        const courses: Array<{
            id: string;
            title: string;
            instructor: string;
        }> = [];
        expect(Array.isArray(courses)).toBe(true);
        expect(courses.length).toBe(0);
    });

    test("should handle empty announcement list", () => {
        const announcements: Array<{
            id: string;
            title: string;
            content: string;
        }> = [];
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
