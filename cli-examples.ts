#!/usr/bin/env bun
/* eslint-disable functional/no-class */

/**
 * Complete CLI Usage Example
 *
 * This script demonstrates all features of the chukyo-cli
 * requirements-agent interface.
 */

console.log("🚀 Chukyo CLI - Complete Usage Example");
console.log("=====================================\n");

// Step 1: Environment Validation
console.log("📋 Step 1: Environment Validation");
console.log("Run this command to check your setup:");
console.log("   ./chukyo-cli validate");
console.log("   ./chukyo-cli validate --verbose");
console.log("");

// Step 2: Configuration
console.log("⚙️  Step 2: Configuration and Help");
console.log("View configuration and examples:");
console.log("   ./chukyo-cli config");
console.log("   ./chukyo-cli config --examples");
console.log("");

// Step 3: Single Page Analysis
console.log("🔍 Step 3: Single Page Analysis");
console.log("Analyze a single Manabo page:");
console.log('   ./chukyo-cli analyze --url "https://manabo.cnc.chukyo-u.ac.jp/ct/home"');
console.log('   ./chukyo-cli analyze --url "..." --output requirements.md --verbose');
console.log("");

// Step 4: Batch Analysis
console.log("📦 Step 4: Batch Analysis");
console.log("Create a URLs file:");
console.log('   echo "https://manabo.cnc.chukyo-u.ac.jp/ct/home');
console.log("https://manabo.cnc.chukyo-u.ac.jp/ct/lesson_123");
console.log('https://manabo.cnc.chukyo-u.ac.jp/ct/assignment_456" > urls.txt');
console.log("");
console.log("Run batch analysis:");
console.log("   ./chukyo-cli analyze --batch-file urls.txt --output batch-results.md");
console.log("   ./chukyo-cli analyze --batch  # Interactive mode");
console.log("");

// Step 5: Cache Management
console.log("💾 Step 5: Cache Management");
console.log("Manage the analysis cache:");
console.log("   ./chukyo-cli cache --info");
console.log("   ./chukyo-cli cache --clear");
console.log("   ./chukyo-cli analyze --url '...' --no-cache  # Bypass cache");
console.log("");

// Step 6: Advanced Usage
console.log("🔧 Step 6: Advanced Usage");
console.log("Advanced features and options:");
console.log("   ./chukyo-cli analyze --url '...' --api-key 'custom-key'");
console.log("   ./chukyo-cli analyze --batch-file urls.txt --verbose --no-cache");
console.log("");

// Example Output
console.log("📄 Example Output Structure:");
console.log("The CLI generates comprehensive requirements including:");
console.log("  • Executive summary of page functionality");
console.log("  • Table of UI elements with CSS selectors");
console.log("  • Detailed user interaction workflows");
console.log("  • API endpoints and data flow analysis");
console.log("  • Automation and testing considerations");
console.log("  • Page-specific business logic");
console.log("");

// Environment Setup
console.log("🔐 Environment Setup:");
console.log("Before running analysis, set your API key:");
console.log("   export GOOGLE_AI_API_KEY='your-google-ai-api-key'");
console.log("");

// Real-World Example
console.log("🌍 Real-World Example:");
console.log("Complete workflow for analyzing a Manabo lesson page:");
console.log("");
console.log("1. Validate environment:");
console.log("   ./chukyo-cli validate");
console.log("");
console.log("2. Analyze the page:");
console.log("   ./chukyo-cli analyze \\");
console.log('     --url "https://manabo.cnc.chukyo-u.ac.jp/ct/lesson_12345" \\');
console.log("     --output lesson-requirements.md \\");
console.log("     --verbose");
console.log("");
console.log("3. Check the generated requirements:");
console.log("   cat lesson-requirements.md");
console.log("");
console.log("4. View cache status:");
console.log("   ./chukyo-cli cache --info");
console.log("");

console.log("✅ Ready to analyze Manabo pages!");
console.log("For more help: ./chukyo-cli --help");
