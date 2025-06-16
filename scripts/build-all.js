#!/usr/bin/env bun
import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

async function buildAll() {
    const packagesDir = join(process.cwd(), "packages");
    const packages = await readdir(packagesDir);

    console.log("Building all packages...\n");

    for (const pkg of packages) {
        const packagePath = join(packagesDir, pkg);
        console.log(`Building ${pkg}...`);

        try {
            const { stdout, stderr } = await execAsync("bun run build", { cwd: packagePath });
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            console.log(`✅ ${pkg} built successfully\n`);
        } catch (error) {
            console.error(`❌ Failed to build ${pkg}:`, error.message);
            process.exit(1);
        }
    }

    console.log("🎉 All packages built successfully!");
}

buildAll().catch(console.error);
