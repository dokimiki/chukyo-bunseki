#!/usr/bin/env bun
import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

async function testAll() {
    const packagesDir = join(process.cwd(), "packages");
    const packages = await readdir(packagesDir);

    console.log("Running tests for all packages...\n");

    for (const pkg of packages) {
        const packagePath = join(packagesDir, pkg);
        console.log(`Testing ${pkg}...`);

        try {
            const { stdout, stderr } = await execAsync("bun run test", { cwd: packagePath });
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            console.log(`✅ ${pkg} tests passed\n`);
        } catch (error) {
            console.error(`❌ Tests failed for ${pkg}:`, error.message);
            process.exit(1);
        }
    }

    console.log("🎉 All package tests passed!");
}

testAll().catch(console.error);
