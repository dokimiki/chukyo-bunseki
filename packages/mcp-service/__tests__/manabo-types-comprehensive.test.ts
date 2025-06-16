import { test, expect, describe } from "bun:test";
import type {
    AnalyzeManaboPageArgs,
    AnalyzeManaboPageResult,
    ManaboPageAnalysis,
    ManaboPageStructure,
    ManaboAction,
    ManaboDataElement,
    ManaboNavigation,
} from "../src/types/manabo.ts";
import { ManaboPageType } from "../src/types/manabo.ts";

describe("Manabo Types Comprehensive Tests", () => {
    describe("AnalyzeManaboPageArgs", () => {
        test("should validate required url field", () => {
            const validArgs: AnalyzeManaboPageArgs = {
                url: "https://manabo.cnc.chukyo-u.ac.jp",
            };

            expect(validArgs.url).toBe("https://manabo.cnc.chukyo-u.ac.jp");
            expect(validArgs.includeScreenshot).toBeUndefined();
            expect(validArgs.includeDOM).toBeUndefined();
        });

        test("should handle optional fields correctly", () => {
            const argsWithOptions: AnalyzeManaboPageArgs = {
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                includeScreenshot: true,
                includeDOM: false,
            };

            expect(argsWithOptions.includeScreenshot).toBe(true);
            expect(argsWithOptions.includeDOM).toBe(false);
        });

        test("should accept various URL formats", () => {
            const urlFormats = [
                "https://manabo.cnc.chukyo-u.ac.jp",
                "https://manabo.cnc.chukyo-u.ac.jp/",
                "https://manabo.cnc.chukyo-u.ac.jp/course/123",
                "https://manabo.cnc.chukyo-u.ac.jp/assignment/456?tab=details",
            ];

            urlFormats.forEach((url) => {
                const args: AnalyzeManaboPageArgs = { url };
                expect(args.url).toBe(url);
            });
        });
    });

    describe("AnalyzeManaboPageResult", () => {
        test("should handle successful result", () => {
            const mockAnalysis: ManaboPageAnalysis = {
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                title: "中京大学 Manabo",
                pageType: ManaboPageType.TOP,
                structure: {
                    selectors: { main: "main" },
                    actions: [],
                    dataElements: [],
                    navigation: [],
                },
                timestamp: new Date().toISOString(),
            };

            const successResult: AnalyzeManaboPageResult = {
                success: true,
                analysis: mockAnalysis,
            };

            expect(successResult.success).toBe(true);
            expect(successResult.analysis).toBeDefined();
            expect(successResult.error).toBeUndefined();
        });

        test("should handle error result", () => {
            const errorResult: AnalyzeManaboPageResult = {
                success: false,
                error: "Network connection failed",
            };

            expect(errorResult.success).toBe(false);
            expect(errorResult.error).toBe("Network connection failed");
            expect(errorResult.analysis).toBeUndefined();
        });

        test("should handle result without optional analysis", () => {
            const minimalResult: AnalyzeManaboPageResult = {
                success: false,
            };

            expect(minimalResult.success).toBe(false);
            expect(minimalResult.analysis).toBeUndefined();
            expect(minimalResult.error).toBeUndefined();
        });
    });

    describe("ManaboPageAnalysis", () => {
        test("should handle complete analysis with all optional fields", () => {
            const completeAnalysis: ManaboPageAnalysis = {
                url: "https://manabo.cnc.chukyo-u.ac.jp/course/123",
                title: "Advanced Mathematics Course",
                pageType: ManaboPageType.COURSES,
                structure: {
                    selectors: {
                        header: "header",
                        navigation: "nav",
                        content: "main",
                        footer: "footer",
                    },
                    actions: [
                        {
                            type: "click",
                            selector: ".course-link",
                            description: "Navigate to course details",
                            required: false,
                        },
                    ],
                    dataElements: [
                        {
                            type: "text",
                            selector: ".course-title",
                            description: "Course title",
                            example: "Advanced Mathematics",
                        },
                    ],
                    navigation: [
                        {
                            label: "Home",
                            selector: "nav a[href='/']",
                            url: "/",
                            description: "Go to home page",
                        },
                    ],
                },
                screenshot: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                domContent: "<html><head><title>Test</title></head><body><main>Content</main></body></html>",
                timestamp: "2024-01-01T00:00:00.000Z",
            };

            expect(completeAnalysis.url).toContain("manabo.cnc.chukyo-u.ac.jp");
            expect(completeAnalysis.pageType).toBe(ManaboPageType.COURSES);
            expect(completeAnalysis.screenshot).toBeDefined();
            expect(completeAnalysis.domContent).toBeDefined();
            expect(completeAnalysis.structure.selectors).toHaveProperty("header");
            expect(completeAnalysis.structure.actions).toHaveLength(1);
        });

        test("should handle minimal analysis without optional fields", () => {
            const minimalAnalysis: ManaboPageAnalysis = {
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                title: "Manabo",
                pageType: ManaboPageType.TOP,
                structure: {
                    selectors: {},
                    actions: [],
                    dataElements: [],
                    navigation: [],
                },
                timestamp: new Date().toISOString(),
            };

            expect(minimalAnalysis.screenshot).toBeUndefined();
            expect(minimalAnalysis.domContent).toBeUndefined();
            expect(minimalAnalysis.structure.actions).toHaveLength(0);
        });

        test("should validate timestamp format", () => {
            const analysis: ManaboPageAnalysis = {
                url: "https://manabo.cnc.chukyo-u.ac.jp",
                title: "Test",
                pageType: ManaboPageType.OTHER,
                structure: {
                    selectors: {},
                    actions: [],
                    dataElements: [],
                    navigation: [],
                },
                timestamp: new Date().toISOString(),
            };

            const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
            expect(analysis.timestamp).toMatch(timestampRegex);
        });
    });

    describe("ManaboPageStructure", () => {
        test("should handle complex page structure", () => {
            const complexStructure: ManaboPageStructure = {
                selectors: {
                    header: "header.main-header",
                    navigation: "nav.primary-nav",
                    sidebar: "aside.sidebar",
                    content: "main.content-area",
                    footer: "footer.main-footer",
                    forms: "form.search-form",
                    buttons: "button.action-btn",
                    links: "a.nav-link",
                },
                actions: [
                    {
                        type: "form",
                        selector: "form#search",
                        description: "Search courses",
                        required: false,
                    },
                    {
                        type: "click",
                        selector: "button.submit",
                        description: "Submit form",
                        required: true,
                    },
                    {
                        type: "navigation",
                        selector: "nav a.home-link",
                        description: "Navigate to home",
                    },
                ],
                dataElements: [
                    {
                        type: "table",
                        selector: "table.course-list",
                        description: "Course listing table",
                    },
                    {
                        type: "list",
                        selector: "ul.announcement-list",
                        description: "Recent announcements",
                        example: "System maintenance scheduled",
                    },
                    {
                        type: "date",
                        selector: ".last-updated",
                        description: "Last update timestamp",
                        example: "2024-01-01 10:00:00",
                    },
                ],
                navigation: [
                    {
                        label: "Dashboard",
                        selector: "nav a[href='/dashboard']",
                        url: "/dashboard",
                        description: "Go to dashboard",
                    },
                    {
                        label: "Courses",
                        selector: "nav a[href='/courses']",
                        url: "/courses",
                        description: "View all courses",
                    },
                ],
            };

            expect(Object.keys(complexStructure.selectors)).toHaveLength(8);
            expect(complexStructure.actions).toHaveLength(3);
            expect(complexStructure.dataElements).toHaveLength(3);
            expect(complexStructure.navigation).toHaveLength(2);
        });

        test("should handle empty structure", () => {
            const emptyStructure: ManaboPageStructure = {
                selectors: {},
                actions: [],
                dataElements: [],
                navigation: [],
            };

            expect(Object.keys(emptyStructure.selectors)).toHaveLength(0);
            expect(emptyStructure.actions).toHaveLength(0);
            expect(emptyStructure.dataElements).toHaveLength(0);
            expect(emptyStructure.navigation).toHaveLength(0);
        });
    });

    describe("ManaboAction", () => {
        test("should handle different action types", () => {
            const clickAction: ManaboAction = {
                type: "click",
                selector: "button.submit",
                description: "Submit the form",
                required: true,
            };

            const formAction: ManaboAction = {
                type: "form",
                selector: "form#login",
                description: "Login form",
            };

            const navAction: ManaboAction = {
                type: "navigation",
                selector: "nav a.home",
                description: "Navigate home",
                required: false,
            };

            expect(clickAction.type).toBe("click");
            expect(clickAction.required).toBe(true);

            expect(formAction.type).toBe("form");
            expect(formAction.required).toBeUndefined();

            expect(navAction.type).toBe("navigation");
            expect(navAction.required).toBe(false);
        });

        test("should validate action properties", () => {
            const action: ManaboAction = {
                type: "click",
                selector: ".btn-primary",
                description: "Primary action button",
            };

            expect(action.selector).toMatch(/^\./); // CSS class selector
            expect(action.description).toContain("button");
        });
    });

    describe("ManaboDataElement", () => {
        test("should handle different data element types", () => {
            const textElement: ManaboDataElement = {
                type: "text",
                selector: "h1.title",
                description: "Page title",
                example: "Course Overview",
            };

            const listElement: ManaboDataElement = {
                type: "list",
                selector: "ul.items",
                description: "Item list",
            };

            const tableElement: ManaboDataElement = {
                type: "table",
                selector: "table.data",
                description: "Data table",
                example: "Student grades table",
            };

            const linkElement: ManaboDataElement = {
                type: "link",
                selector: "a.external",
                description: "External link",
            };

            const dateElement: ManaboDataElement = {
                type: "date",
                selector: ".timestamp",
                description: "Creation date",
                example: "2024-01-01",
            };

            expect(textElement.type).toBe("text");
            expect(listElement.type).toBe("list");
            expect(tableElement.type).toBe("table");
            expect(linkElement.type).toBe("link");
            expect(dateElement.type).toBe("date");

            expect(textElement.example).toBeDefined();
            expect(listElement.example).toBeUndefined();
        });
    });

    describe("ManaboNavigation", () => {
        test("should handle navigation with URL", () => {
            const navWithUrl: ManaboNavigation = {
                label: "Assignments",
                selector: "nav a[href='/assignments']",
                url: "/assignments",
                description: "View assignments",
            };

            expect(navWithUrl.url).toBe("/assignments");
            expect(navWithUrl.label).toBe("Assignments");
        });

        test("should handle navigation without URL", () => {
            const navWithoutUrl: ManaboNavigation = {
                label: "Menu Toggle",
                selector: "button.menu-toggle",
                description: "Toggle navigation menu",
            };

            expect(navWithoutUrl.url).toBeUndefined();
            expect(navWithoutUrl.label).toBe("Menu Toggle");
        });

        test("should validate navigation properties", () => {
            const navigation: ManaboNavigation = {
                label: "Home",
                selector: "a.home-link",
                url: "/",
                description: "Go to home page",
            };

            expect(navigation.label).toMatch(/\w+/); // Contains word characters
            expect(navigation.selector).toMatch(/^[a-zA-Z.#[\]="'-]+/); // Valid CSS selector pattern
            expect(navigation.description).toContain("Go to");
        });
    });

    describe("Page Type Specific Validation", () => {
        test("should validate each page type enum value", () => {
            const pageTypes = [
                ManaboPageType.TOP,
                ManaboPageType.COURSES,
                ManaboPageType.ASSIGNMENTS,
                ManaboPageType.SYLLABUS,
                ManaboPageType.GRADES,
                ManaboPageType.ANNOUNCEMENTS,
                ManaboPageType.TIMETABLE,
                ManaboPageType.OTHER,
            ];

            pageTypes.forEach((pageType) => {
                const analysis: ManaboPageAnalysis = {
                    url: "https://manabo.cnc.chukyo-u.ac.jp",
                    title: `${pageType} Page`,
                    pageType,
                    structure: {
                        selectors: {},
                        actions: [],
                        dataElements: [],
                        navigation: [],
                    },
                    timestamp: new Date().toISOString(),
                };

                expect(Object.values(ManaboPageType)).toContain(analysis.pageType);
            });
        });
    });

    describe("Type Integration", () => {
        test("should create complete analysis object with all types", () => {
            const fullAnalysis: ManaboPageAnalysis = {
                url: "https://manabo.cnc.chukyo-u.ac.jp/course/123",
                title: "Machine Learning Course",
                pageType: ManaboPageType.COURSES,
                structure: {
                    selectors: {
                        courseInfo: ".course-info",
                        syllabus: ".syllabus-link",
                        assignments: ".assignments-section",
                    },
                    actions: [
                        {
                            type: "click",
                            selector: ".enroll-btn",
                            description: "Enroll in course",
                            required: false,
                        },
                        {
                            type: "form",
                            selector: "form.comment",
                            description: "Submit comment",
                        },
                    ],
                    dataElements: [
                        {
                            type: "text",
                            selector: ".course-title",
                            description: "Course name",
                            example: "Machine Learning",
                        },
                        {
                            type: "date",
                            selector: ".start-date",
                            description: "Course start date",
                            example: "2024-04-01",
                        },
                        {
                            type: "table",
                            selector: ".grade-table",
                            description: "Student grades",
                        },
                    ],
                    navigation: [
                        {
                            label: "Syllabus",
                            selector: "a.syllabus-link",
                            url: "/course/123/syllabus",
                            description: "View course syllabus",
                        },
                        {
                            label: "Assignments",
                            selector: "a.assignments-link",
                            url: "/course/123/assignments",
                            description: "View course assignments",
                        },
                    ],
                },
                screenshot: "base64-encoded-screenshot-data",
                domContent: "<html>...</html>",
                timestamp: "2024-01-01T12:00:00.000Z",
            };

            // Verify all parts work together
            expect(fullAnalysis).toBeDefined();
            expect(fullAnalysis.pageType).toBe(ManaboPageType.COURSES);
            expect(fullAnalysis.structure.actions).toHaveLength(2);
            expect(fullAnalysis.structure.dataElements).toHaveLength(3);
            expect(fullAnalysis.structure.navigation).toHaveLength(2);

            // Verify type consistency
            expect(fullAnalysis.structure.actions[0].type).toBe("click");
            expect(fullAnalysis.structure.dataElements[0].type).toBe("text");
            expect(fullAnalysis.structure.navigation[0].url).toBeDefined();
        });
    });
});
