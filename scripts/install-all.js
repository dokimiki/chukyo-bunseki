#!/usr/bin/env bun
import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

async function installAll() {
    const packagesDir = join(process.cwd(), "packages");
    const packages = await readdir(packagesDir);

    // First install root dependencies
    console.log("Installing root dependencies...");
    try {
        const { stdout, stderr } = await execAsync("bun install");
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log("✅ Root dependencies installed\n");
    } catch (error) {
        console.error("❌ Failed to install root dependencies:", error.message);
        process.exit(1);
    }

    console.log("Installing dependencies for all packages...\n");

    for (const pkg of packages) {
        const packagePath = join(packagesDir, pkg);
        console.log(`Installing dependencies for ${pkg}...`);

        try {
            const { stdout, stderr } = await execAsync("bun install", { cwd: packagePath });
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            console.log(`✅ ${pkg} dependencies installed\n`);
        } catch (error) {
            console.error(`❌ Failed to install dependencies for ${pkg}:`, error.message);
            process.exit(1);
        }
    }

    console.log("🎉 All dependencies installed successfully!");
}

installAll().catch(console.error);
