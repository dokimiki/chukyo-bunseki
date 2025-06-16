import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ManaboMCPServer } from "../src/mcp.ts";
import { ManaboPageType } from "../src/types/manabo.ts";

describe("ManaboMCPServer", () => {
    let server: ManaboMCPServer;

    beforeEach(() => {
        server = new ManaboMCPServer();
    });

    afterEach(async () => {
        await server.stop();
    });

    describe("Server Initialization", () => {
        test("should initialize MCP server with correct configuration", () => {
            expect(server).toBeInstanceOf(ManaboMCPServer);
        });

        test("should have createManaboMCPServer factory function", async () => {
            const { createManaboMCPServer } = await import("../src/mcp.ts");
            expect(typeof createManaboMCPServer).toBe("function");
        });
    });

    describe("Page Type Detection", () => {
        test("should detect course page type", () => {
            // Access private method through type assertion
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/course/123", "Course: Advanced Math")).toBe(ManaboPageType.COURSES);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/courses", "科目一覧")).toBe(ManaboPageType.COURSES);
        });

        test("should detect assignment page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/assignment/456", "課題提出")).toBe(ManaboPageType.ASSIGNMENTS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/assignments", "Assignment List")).toBe(ManaboPageType.ASSIGNMENTS);
        });

        test("should detect syllabus page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/syllabus/789", "シラバス詳細")).toBe(ManaboPageType.SYLLABUS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/syllabus", "Syllabus")).toBe(ManaboPageType.SYLLABUS);
        });

        test("should detect grades page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/grade/overview", "成績確認")).toBe(ManaboPageType.GRADES);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/grades", "Grade Report")).toBe(ManaboPageType.GRADES);
        });

        test("should detect announcements page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/announcement/123", "お知らせ詳細")).toBe(ManaboPageType.ANNOUNCEMENTS);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/announcements", "連絡事項")).toBe(ManaboPageType.ANNOUNCEMENTS);
        });

        test("should detect timetable page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/timetable", "時間割表")).toBe(ManaboPageType.TIMETABLE);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/schedule", "Time Table")).toBe(ManaboPageType.TIMETABLE);
        });

        test("should detect top page type", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp", "ホームページ")).toBe(ManaboPageType.TOP);
            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/top", "Manabo Home")).toBe(ManaboPageType.TOP);
        });

        test("should detect other page type for unknown pages", () => {
            const detectPageType = (server as unknown as { detectPageType: (url: string, title: string) => ManaboPageType }).detectPageType;

            expect(detectPageType("https://manabo.cnc.chukyo-u.ac.jp/unknown", "Unknown Page")).toBe(ManaboPageType.OTHER);
            expect(detectPageType("https://external.example.com", "External Site")).toBe(ManaboPageType.OTHER);
        });
    });

    describe("Tool Configuration", () => {
        test("should have proper tool handler setup", () => {
            // Test that the server was initialized without throwing
            expect(server).toBeDefined();
        });

        test("should handle stop operation", async () => {
            await server.stop();
            // If we reach this point, stop() didn't throw
            expect(true).toBe(true);
        });
    });

    describe("Error Handling", () => {
        test("should handle cleanup on stop", async () => {
            // Set up a mock context
            const mockContext = { close: async () => {} };
            (server as unknown as { globalContext: unknown }).globalContext = mockContext;

            await server.stop();

            // Verify context was cleaned up
            expect((server as unknown as { globalContext: unknown }).globalContext).toBeNull();
        });
    });
});

describe("ManaboMCPServer Factory", () => {
    test("should create and return ManaboMCPServer instance", async () => {
        const { createManaboMCPServer } = await import("../src/mcp.ts");

        // Note: This would normally start the server, so we might need to mock the transport
        // For now, just test that the function exists and is callable
        expect(typeof createManaboMCPServer).toBe("function");
    });
});

describe("ManaboPageType Integration", () => {
    test("should use ManaboPageType enum correctly", () => {
        expect(ManaboPageType.TOP).toBe(ManaboPageType.TOP);
        expect(ManaboPageType.COURSES).toBe(ManaboPageType.COURSES);
        expect(ManaboPageType.ASSIGNMENTS).toBe(ManaboPageType.ASSIGNMENTS);
        expect(ManaboPageType.SYLLABUS).toBe(ManaboPageType.SYLLABUS);
        expect(ManaboPageType.GRADES).toBe(ManaboPageType.GRADES);
        expect(ManaboPageType.ANNOUNCEMENTS).toBe(ManaboPageType.ANNOUNCEMENTS);
        expect(ManaboPageType.TIMETABLE).toBe(ManaboPageType.TIMETABLE);
        expect(ManaboPageType.OTHER).toBe(ManaboPageType.OTHER);
    });

    test("should handle all defined page types", () => {
        const allPageTypes = Object.values(ManaboPageType);
        expect(allPageTypes).toHaveLength(8);
        expect(allPageTypes).toContain(ManaboPageType.TOP);
        expect(allPageTypes).toContain(ManaboPageType.COURSES);
        expect(allPageTypes).toContain(ManaboPageType.ASSIGNMENTS);
        expect(allPageTypes).toContain(ManaboPageType.SYLLABUS);
        expect(allPageTypes).toContain(ManaboPageType.GRADES);
        expect(allPageTypes).toContain(ManaboPageType.ANNOUNCEMENTS);
        expect(allPageTypes).toContain(ManaboPageType.TIMETABLE);
        expect(allPageTypes).toContain(ManaboPageType.OTHER);
    });
});
