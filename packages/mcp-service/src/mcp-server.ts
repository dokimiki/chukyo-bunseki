#!/usr/bin/env bun
/**
 * MCP Server entry point for Manabo analysis
 * This server provides tools for analyzing Manabo page structures via Model Context Protocol
 */

import { createManaboMCPServer } from "./mcp.js";

async function main(): Promise<void> {
    try {
        console.error("Starting Manabo MCP Server...");
        const server = await createManaboMCPServer();

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
            console.error("Shutting down MCP server...");
            await server.stop();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            console.error("Shutting down MCP server...");
            await server.stop();
            process.exit(0);
        });

        console.error("Manabo MCP Server started successfully");
    } catch (error) {
        console.error("Failed to start MCP server:", error);
        process.exit(1);
    }
}

if (import.meta.main) {
    main().catch((error) => {
        console.error("Unhandled error in MCP server:", error);
        process.exit(1);
    });
}
