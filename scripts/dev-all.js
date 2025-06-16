#!/usr/bin/env bun
import { exec } from "child_process";
import { promisify } from "util";
import { readdir } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

async function devAll() {
    const packagesDir = join(process.cwd(), "packages");
    const packages = await readdir(packagesDir);

    console.log("Starting dev mode for all packages...\n");

    // Run dev commands in parallel since they're typically watch modes
    const promises = packages.map(async (pkg) => {
        const packagePath = join(packagesDir, pkg);
        console.log(`Starting dev for ${pkg}...`);

        try {
            const child = exec("bun run dev", { cwd: packagePath });

            child.stdout?.on("data", (data) => {
                console.log(`[${pkg}] ${data}`);
            });

            child.stderr?.on("data", (data) => {
                console.error(`[${pkg}] ${data}`);
            });

            return new Promise((resolve, reject) => {
                child.on("exit", (code) => {
                    if (code === 0) {
                        console.log(`✅ ${pkg} dev completed`);
                        resolve(undefined);
                    } else {
                        console.error(`❌ ${pkg} dev failed with code ${code}`);
                        reject(new Error(`Dev failed for ${pkg}`));
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Failed to start dev for ${pkg}:`, error.message);
            throw error;
        }
    });

    try {
        await Promise.all(promises);
        console.log("🎉 All packages dev completed!");
    } catch (error) {
        console.error("❌ Some dev processes failed");
        process.exit(1);
    }
}

devAll().catch(console.error);
