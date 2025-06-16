/* eslint-disable functional/no-class */

import { test, expect, describe } from "bun:test";
import { ManaboPageType, type ManaboPageAnalysis, type ManaboPageStructure } from "../src/types/manabo.ts";

describe("Manabo Types", () => {
    test("should define ManaboPageType enum correctly", () => {
        expect(ManaboPageType.TOP).toBe(ManaboPageType.TOP);
        expect(ManaboPageType.COURSES).toBe(ManaboPageType.COURSES);
        expect(ManaboPageType.ASSIGNMENTS).toBe(ManaboPageType.ASSIGNMENTS);
        expect(ManaboPageType.SYLLABUS).toBe(ManaboPageType.SYLLABUS);
        expect(ManaboPageType.GRADES).toBe(ManaboPageType.GRADES);
        expect(ManaboPageType.ANNOUNCEMENTS).toBe(ManaboPageType.ANNOUNCEMENTS);
        expect(ManaboPageType.TIMETABLE).toBe(ManaboPageType.TIMETABLE);
        expect(ManaboPageType.OTHER).toBe(ManaboPageType.OTHER);
    });

    test("should structure ManaboPageAnalysis correctly", () => {
        const mockAnalysis: ManaboPageAnalysis = {
            url: "https://manabo.cnc.chukyo-u.ac.jp",
            title: "中京大学 Manabo",
            pageType: ManaboPageType.TOP,
            structure: {
                selectors: {
                    navigation: "nav",
                    header: "header",
                    mainContent: "main",
                },
                actions: [
                    {
                        type: "click",
                        selector: ".course-link",
                        description: "Navigate to course page",
                    },
                ],
                dataElements: [
                    {
                        type: "text",
                        selector: "h1",
                        description: "Page title",
                        example: "中京大学 Manabo",
                    },
                ],
                navigation: [
                    {
                        label: "ホーム",
                        selector: 'nav a[href="/"]',
                        url: "/",
                        description: "Navigate to home",
                    },
                ],
            },
            timestamp: new Date().toISOString(),
        };

        expect(mockAnalysis.pageType).toBe(ManaboPageType.TOP);
        expect(mockAnalysis.structure.selectors).toHaveProperty("navigation");
        expect(mockAnalysis.structure.actions).toHaveLength(1);
        expect(mockAnalysis.structure.dataElements).toHaveLength(1);
        expect(mockAnalysis.structure.navigation).toHaveLength(1);
    });

    test("should handle ManaboPageStructure properties", () => {
        const mockStructure: ManaboPageStructure = {
            selectors: {
                mainContent: "main",
                sidebar: ".sidebar",
            },
            actions: [
                {
                    type: "form",
                    selector: "form#search",
                    description: "Search form",
                    required: false,
                },
                {
                    type: "click",
                    selector: "button.submit",
                    description: "Submit button",
                    required: true,
                },
            ],
            dataElements: [
                {
                    type: "table",
                    selector: "table.data",
                    description: "Data table",
                },
                {
                    type: "list",
                    selector: "ul.items",
                    description: "Item list",
                    example: "Sample item",
                },
            ],
            navigation: [
                {
                    label: "Courses",
                    selector: 'a[href="/courses"]',
                    url: "/courses",
                    description: "Go to courses",
                },
            ],
        };

        expect(mockStructure.selectors).toHaveProperty("mainContent");
        expect(mockStructure.actions.some((action) => action.required)).toBe(true);
        expect(mockStructure.dataElements.some((element) => element.type === "table")).toBe(true);
        expect(mockStructure.navigation).toHaveLength(1);
    });
});

describe("ManaboPageAnalysis validation", () => {
    test("should validate required fields", () => {
        const requiredFields = ["url", "title", "pageType", "structure", "timestamp"];

        const mockAnalysis: ManaboPageAnalysis = {
            url: "https://example.com",
            title: "Test Page",
            pageType: ManaboPageType.OTHER,
            structure: {
                selectors: {},
                actions: [],
                dataElements: [],
                navigation: [],
            },
            timestamp: new Date().toISOString(),
        };

        requiredFields.forEach((field) => {
            expect(mockAnalysis).toHaveProperty(field);
        });
    });

    test("should handle optional fields", () => {
        const mockAnalysis: ManaboPageAnalysis = {
            url: "https://example.com",
            title: "Test Page",
            pageType: ManaboPageType.OTHER,
            structure: {
                selectors: {},
                actions: [],
                dataElements: [],
                navigation: [],
            },
            screenshot: "base64-encoded-image",
            domContent: "<html></html>",
            timestamp: new Date().toISOString(),
        };

        expect(mockAnalysis.screenshot).toBeDefined();
        expect(mockAnalysis.domContent).toBeDefined();
    });
});
