/* eslint-disable functional/no-class */

import { test, expect, describe } from "bun:test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("CLI Integration Tests", () => {
    test("CLI should show help", async () => {
        const { stdout } = await execAsync("bun run dist/index.js --help");
        expect(stdout).toContain("Chukyo University analysis tools");
        expect(stdout).toContain("analyze");
        expect(stdout).toContain("validate");
        expect(stdout).toContain("cache");
        expect(stdout).toContain("config");
    });

    test("CLI validate command should work", async () => {
        try {
            const { stdout } = await execAsync("bun run dist/index.js validate");
            expect(stdout).toContain("Validating environment");
        } catch (error: any) {
            // Command might exit with code 1 due to missing API key, which is expected
            expect(error.stdout).toContain("Validating environment");
        }
    });

    test("CLI config command should show configuration", async () => {
        const { stdout } = await execAsync("bun run dist/index.js config");
        expect(stdout).toContain("Configuration");
        expect(stdout).toContain("API Key");
        expect(stdout).toContain("Environment Variables");
    });

    test("CLI cache command should show cache info", async () => {
        const { stdout } = await execAsync("bun run dist/index.js cache --info");
        expect(stdout).toContain("Cache Information");
        expect(stdout).toContain("Size:");
        expect(stdout).toContain("TTL:");
    });

    test("CLI analyze command should show proper error without URL", async () => {
        try {
            await execAsync("bun run dist/index.js analyze");
        } catch (error: any) {
            expect(error.stdout).toContain("URL is required");
        }
    });

    test("CLI should handle invalid subcommands gracefully", async () => {
        try {
            await execAsync("bun run dist/index.js invalid-command");
        } catch (error: any) {
            expect(error.code).toBe(1);
        }
    });
});
