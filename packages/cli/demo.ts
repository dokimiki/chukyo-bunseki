#!/usr/bin/env bun
/* eslint-disable functional/no-class */

/**
 * Demo script for chukyo-cli
 *
 * This script demonstrates how to use the requirements-agent CLI
 * for analyzing Manabo pages and generating requirements documentation.
 */

console.log("🚀 Chukyo CLI Demo");
console.log("=================\n");

console.log("📋 Available Commands:");
console.log("- chukyo-cli analyze --url <manabo-url>");
console.log("- chukyo-cli validate");
console.log("- chukyo-cli cache --info");
console.log("- chukyo-cli config --examples");
console.log("");

console.log("🔧 Quick Test:");
console.log("Run these commands to test the CLI:");
console.log("");
console.log("1. Validate environment:");
console.log("   bun run dist/index.js validate");
console.log("");
console.log("2. Show examples:");
console.log("   bun run dist/index.js config --examples");
console.log("");
console.log("3. Check cache:");
console.log("   bun run dist/index.js cache --info");
console.log("");

console.log("💡 For real analysis, set GOOGLE_AI_API_KEY and run:");
console.log("   export GOOGLE_AI_API_KEY='your-key'");
console.log("   chukyo-cli analyze --url 'https://manabo.cnc.chukyo-u.ac.jp/...' --verbose");
console.log("");

console.log("✅ Demo completed! Check README.md for full documentation.");
