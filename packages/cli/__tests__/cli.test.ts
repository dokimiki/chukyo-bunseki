import { test, expect, describe } from "bun:test";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const cliPath = path.join("packages", "cli", "dist", "index.js");

describe("CLI Integration Tests", () => {
    test("CLI should show help", async () => {
        try {
            const { stdout } = await execAsync(`bun run ${cliPath} --help`);
            expect(stdout).toContain("Chukyo University analysis tools");
            expect(stdout).toContain("analyze");
            expect(stdout).toContain("validate");
            expect(stdout).toContain("cache");
            expect(stdout).toContain("config");
        } catch (error) {
            // cmd-ts exits with code 1 for help, which is expected
            // Check that we still got the help output
            expect(error.stdout).toContain("Chukyo University analysis tools");
            expect(error.stdout).toContain("analyze");
            expect(error.stdout).toContain("validate");
            expect(error.stdout).toContain("cache");
            expect(error.stdout).toContain("config");
        }
    });

    test("CLI validate command should work", async () => {
        try {
            const { stdout } = await execAsync(`bun run ${cliPath} validate`);
            expect(stdout).toContain("Validating environment");
        } catch (error) {
            // Command might exit with code 1 due to missing API key, which is expected
            expect(error.stdout).toContain("Validating environment");
        }
    });

    test("CLI config command should show configuration", async () => {
        const { stdout } = await execAsync(`bun run ${cliPath} config`);
        expect(stdout).toContain("Configuration");
        expect(stdout).toContain("API Key");
        expect(stdout).toContain("Environment Variables");
    });

    test("CLI cache command should show cache info", async () => {
        const { stdout } = await execAsync(`bun run ${cliPath} cache --info`);
        expect(stdout).toContain("Cache Information");
        expect(stdout).toContain("Size:");
        expect(stdout).toContain("TTL:");
    });

    test("CLI analyze command should show proper error without URL", async () => {
        try {
            await execAsync(`bun run ${cliPath} analyze`);
        } catch (error) {
            expect(error.stdout).toContain("URL is required");
        }
    });

    test("CLI should handle invalid subcommands gracefully", async () => {
        try {
            await execAsync(`bun run ${cliPath} invalid-command`);
        } catch (error) {
            expect(error.code).toBe(1);
        }
    });
});
