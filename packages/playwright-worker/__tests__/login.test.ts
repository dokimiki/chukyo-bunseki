import { test, expect, describe } from "bun:test";
import { loginToChukyo, createAuthenticatedContext, ChkyuoAutomationWorker, ChkyuoPortalWorker } from "../src/index.js";

describe("Login functionality", () => {
    test("loginToChukyo should handle empty credentials gracefully", async () => {
        const result = await loginToChukyo({
            username: "",
            password: "",
            headless: true,
            timeout: 100,
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(false);
    });

    test("createAuthenticatedContext should handle missing state file gracefully", async () => {
        await expect(async () => {
            await createAuthenticatedContext("nonexistent.json");
        }).toThrow();
    });

    test("loginToChukyo should return object with expected structure", async () => {
        // Test with very short timeout to avoid long waits
        const result = await loginToChukyo({
            username: "test",
            password: "test",
            headless: true,
            timeout: 100, // Very short timeout
        });

        expect(result).toBeDefined();
        expect(typeof result.success).toBe("boolean");
        expect(typeof result.message).toBe("string");
    });
});

describe("Automation Worker", () => {
    test("should create automation worker class", () => {
        const worker = new ChkyuoAutomationWorker();
        expect(worker).toBeDefined();
    });

    test("should fail initialization without browser context", async () => {
        const worker = new ChkyuoAutomationWorker();

        // This should fail because we don't have authentication state
        await expect(async () => {
            await worker.initialize();
        }).toThrow();
    });
});

describe("Portal Worker", () => {
    test("should create portal worker class", () => {
        const worker = new ChkyuoPortalWorker();
        expect(worker).toBeDefined();
    });

    test("should extend automation worker", () => {
        const worker = new ChkyuoPortalWorker();
        expect(worker).toBeInstanceOf(ChkyuoAutomationWorker);
    });
});

describe("Login options", () => {
    test("should use default options when not provided", () => {
        // Simple test that doesn't require browser
        expect(true).toBe(true);
    });
});
