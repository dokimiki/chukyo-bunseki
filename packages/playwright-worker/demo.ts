#!/usr/bin/env bun

/**
 * Demo script showing how to use the playwright-worker package
 * This is for demonstration purposes only and requires valid credentials
 */

import { loginToChukyo, createPortalWorker, createIntegrationWorker, type LoginOptions } from "./src/index.js";

async function demoLogin() {
    console.log("=== Login Demo ===");

    // Note: Replace with actual credentials for testing
    const loginOptions: LoginOptions = {
        username: process.env.CHUKYO_USERNAME || "your_username",
        password: process.env.CHUKYO_PASSWORD || "your_password",
        headless: false, // Set to true for production
        slowMo: 500, // Slow down for demo purposes
        timeout: 30000,
    };

    try {
        const result = await loginToChukyo(loginOptions);

        if (result.success) {
            console.log("✅ Login successful!");
            console.log(`State saved to: ${result.stateFile}`);
            return true;
        } else {
            console.log("❌ Login failed:", result.message);
            return false;
        }
    } catch (error) {
        console.error("❌ Login error:", error);
        return false;
    }
}

async function demoPortalWorker() {
    console.log("\n=== Portal Worker Demo ===");

    try {
        const worker = await createPortalWorker({
            stateFile: "state.json",
            headless: false,
            slowMo: 1000,
        });

        console.log("✅ Portal worker initialized");

        // Navigate to portal top
        const topResult = await worker.goToPortalTop();
        console.log("Portal top:", topResult.success ? "✅" : "❌", topResult.message);

        // Try to get student information
        const studentInfo = await worker.getStudentInfo();
        if (studentInfo) {
            console.log("📋 Student Info:", studentInfo);
        }

        // Try to get courses
        const courses = await worker.getRegisteredCourses();
        console.log(`📚 Found ${courses.length} registered courses`);

        // Try to get announcements
        const announcements = await worker.getAnnouncements();
        console.log(`📢 Found ${announcements.length} announcements`);

        await worker.cleanup();
        console.log("✅ Portal worker cleanup complete");
    } catch (error) {
        console.error("❌ Portal worker error:", error);
    }
}

async function demoIntegrationWorker() {
    console.log("\n=== Integration Worker Demo ===");

    try {
        const worker = await createIntegrationWorker({
            stateFile: "state.json",
            geminiApiKey: process.env.GOOGLE_AI_API_KEY,
        });

        console.log("✅ Integration worker initialized");

        // Analyze portal top page
        const topAnalysis = await worker.analyzePortalTop();
        if (topAnalysis.success) {
            console.log("📊 Portal top analysis completed");
            console.log("📄 Requirements length:", topAnalysis.requirements.length);
        }

        // Analyze course registration page
        const courseAnalysis = await worker.analyzeCourseRegistration();
        if (courseAnalysis.success) {
            console.log("📊 Course registration analysis completed");
        }

        await worker.cleanup();
        console.log("✅ Integration worker cleanup complete");
    } catch (error) {
        console.error("❌ Integration worker error:", error);
    }
}

async function main() {
    console.log("🚀 Chukyo University Playwright Worker Demo");
    console.log("==========================================");

    // Check if we have required environment variables
    if (!process.env.CHUKYO_USERNAME || !process.env.CHUKYO_PASSWORD) {
        console.log("⚠️  Please set CHUKYO_USERNAME and CHUKYO_PASSWORD environment variables");
        console.log("⚠️  Example: CHUKYO_USERNAME=your_id CHUKYO_PASSWORD=your_pass bun demo.ts");
        console.log("");
        console.log("📝 This demo will run with placeholder credentials and may fail");
        console.log("");
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
        console.log("⚠️  Please set GOOGLE_AI_API_KEY for requirements analysis");
        console.log("");
    }

    try {
        // Demo login
        const loginSuccess = await demoLogin();

        if (loginSuccess) {
            // Demo portal worker
            await demoPortalWorker();

            // Demo integration worker (if API key available)
            if (process.env.GOOGLE_AI_API_KEY) {
                await demoIntegrationWorker();
            } else {
                console.log("\n⚠️  Skipping integration demo (no API key)");
            }
        } else {
            console.log("\n⚠️  Skipping other demos due to login failure");
        }
    } catch (error) {
        console.error("❌ Demo failed:", error);
    }

    console.log("\n🏁 Demo completed");
}

if (require.main === module) {
    main().catch(console.error);
}
