/* eslint-disable functional/no-class */

/**
 * Manabo page analysis result
 */
export interface ManaboPageAnalysis {
    url: string;
    title: string;
    pageType: ManaboPageType;
    structure: ManaboPageStructure;
    screenshot?: string;
    domContent?: string;
    timestamp: string;
}

/**
 * Manabo page types
 */
export enum ManaboPageType {
    TOP = "top",
    COURSES = "courses",
    ASSIGNMENTS = "assignments",
    SYLLABUS = "syllabus",
    GRADES = "grades",
    ANNOUNCEMENTS = "announcements",
    TIMETABLE = "timetable",
    OTHER = "other",
}

/**
 * Manabo page structure analysis
 */
export interface ManaboPageStructure {
    selectors: Record<string, string>;
    actions: ManaboAction[];
    dataElements: ManaboDataElement[];
    navigation: ManaboNavigation[];
}

/**
 * Manabo action (clickable elements, forms, etc.)
 */
export interface ManaboAction {
    type: "click" | "form" | "navigation";
    selector: string;
    description: string;
    required?: boolean;
}

/**
 * Manabo data element (content that can be extracted)
 */
export interface ManaboDataElement {
    type: "text" | "list" | "table" | "link" | "date";
    selector: string;
    description: string;
    example?: string;
}

/**
 * Manabo navigation element
 */
export interface ManaboNavigation {
    label: string;
    selector: string;
    url?: string;
    description: string;
}

/**
 * MCP tool arguments for analyzing Manabo pages
 */
export interface AnalyzeManaboPageArgs {
    url: string;
    includeScreenshot?: boolean;
    includeDOM?: boolean;
}

/**
 * MCP tool result for Manabo page analysis
 */
export interface AnalyzeManaboPageResult {
    success: boolean;
    analysis?: ManaboPageAnalysis;
    error?: string;
}
