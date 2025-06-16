/* eslint-disable functional/no-class */

import { test, expect } from "bun:test";
import { loginToChukyo, createAuthenticatedContext } from "../src/login.ts";

test.describe("Login functionality", () => {
    test("loginToChukyo should return error for invalid credentials", async () => {
        const result = await loginToChukyo({
            username: "invalid",
            password: "invalid",
            headless: true,
            timeout: 5000,
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain("Login failed");
    });

    test("loginToChukyo should validate required parameters", async () => {
        await expect(async () => {
            await loginToChukyo({
                username: "",
                password: "",
            });
        }).toThrow();
    });

    test("createAuthenticatedContext should handle missing state file gracefully", async () => {
        await expect(async () => {
            await createAuthenticatedContext("nonexistent.json");
        }).toThrow();
    });
});

test.describe("Login options", () => {
    test("should use default options when not provided", async () => {
        const result = await loginToChukyo({
            username: "test",
            password: "test",
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(false); // Expected to fail with test credentials
    });

    test("should respect custom timeout", async () => {
        const startTime = Date.now();

        const result = await loginToChukyo({
            username: "test",
            password: "test",
            timeout: 1000, // Very short timeout
        });

        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(2000); // Should timeout quickly
        expect(result.success).toBe(false);
    });
});
