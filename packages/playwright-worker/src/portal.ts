import { ChkyuoAutomationWorker, PageInfo, ActionResult } from "./automation.js";

export interface StudentInfo {
    studentId: string;
    name: string;
    department: string;
    grade: string;
}

export interface CourseInfo {
    courseId: string;
    courseName: string;
    instructor: string;
    credits: number;
    schedule: string;
    status: string;
}

export interface GradeInfo {
    courseId: string;
    courseName: string;
    grade: string;
    credits: number;
    semester: string;
}

export interface AnnouncementInfo {
    id: string;
    title: string;
    content: string;
    date: string;
    sender: string;
    isRead: boolean;
}

/**
 * Chukyo University portal specific automation worker
 */
export class ChkyuoPortalWorker extends ChkyuoAutomationWorker {
    /**
     * Navigate to student portal top page
     */
    async goToPortalTop(): Promise<ActionResult> {
        return await this.navigateTo("https://manabo.cnc.chukyo-u.ac.jp");
    }

    /**
     * Navigate to course registration page
     */
    async goToCourseRegistration(): Promise<ActionResult> {
        const result = await this.goToPortalTop();
        if (!result.success) return result;

        // Navigate to course registration (specific selector needs to be determined)
        return await this.click('a[href*="regist"], a[href*="course"]');
    }

    /**
     * Navigate to grades page
     */
    async goToGrades(): Promise<ActionResult> {
        const result = await this.goToPortalTop();
        if (!result.success) return result;

        // Navigate to grades page (specific selector needs to be determined)
        return await this.click('a[href*="grade"], a[href*="成績"]');
    }

    /**
     * Navigate to syllabus search page
     */
    async goToSyllabus(): Promise<ActionResult> {
        const result = await this.goToPortalTop();
        if (!result.success) return result;

        // Navigate to syllabus (specific selector needs to be determined)
        return await this.click('a[href*="syllabus"], a[href*="シラバス"]');
    }

    /**
     * Navigate to announcements page
     */
    async goToAnnouncements(): Promise<ActionResult> {
        const result = await this.goToPortalTop();
        if (!result.success) return result;

        // Navigate to announcements (specific selector needs to be determined)
        return await this.click('a[href*="announce"], a[href*="お知らせ"]');
    }

    /**
     * Get student information from profile page
     */
    async getStudentInfo(): Promise<StudentInfo | null> {
        const profileResult = await this.click('a[href*="profile"], a[href*="学生情報"]');
        if (!profileResult.success) return null;

        try {
            const studentInfo = await this.evaluate(() => {
                // Extract student information from DOM
                // This is a placeholder - actual selectors need to be determined
                const studentId = document.querySelector(".student-id")?.textContent?.trim() || "";
                const name = document.querySelector(".student-name")?.textContent?.trim() || "";
                const department = document.querySelector(".department")?.textContent?.trim() || "";
                const grade = document.querySelector(".grade")?.textContent?.trim() || "";

                return {
                    studentId,
                    name,
                    department,
                    grade,
                };
            });

            return studentInfo;
        } catch (error) {
            console.error("Failed to extract student info:", error);
            return null;
        }
    }

    /**
     * Get list of registered courses
     */
    async getRegisteredCourses(): Promise<CourseInfo[]> {
        const coursesResult = await this.goToCourseRegistration();
        if (!coursesResult.success) return [];

        try {
            const courses = await this.evaluate(() => {
                // Extract course information from table
                // This is a placeholder - actual selectors need to be determined
                const courseRows = document.querySelectorAll("table tr:not(:first-child)");
                const courses: CourseInfo[] = [];

                courseRows.forEach((row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length >= 5) {
                        courses.push({
                            courseId: cells[0]?.textContent?.trim() || "",
                            courseName: cells[1]?.textContent?.trim() || "",
                            instructor: cells[2]?.textContent?.trim() || "",
                            credits: parseInt(cells[3]?.textContent?.trim() || "0"),
                            schedule: cells[4]?.textContent?.trim() || "",
                            status: cells[5]?.textContent?.trim() || "",
                        });
                    }
                });

                return courses;
            });

            return courses;
        } catch (error) {
            console.error("Failed to extract course info:", error);
            return [];
        }
    }

    /**
     * Search for courses by keyword
     */
    async searchCourses(keyword: string): Promise<CourseInfo[]> {
        const syllabusResult = await this.goToSyllabus();
        if (!syllabusResult.success) return [];

        // Fill search form
        await this.fill('input[name="keyword"], input[name="search"]', keyword);
        await this.click('input[type="submit"], button[type="submit"]');

        // Wait for results
        await this.waitForElement(".search-results, .result-table");

        try {
            const courses = await this.evaluate(() => {
                // Extract search results
                const courseRows = document.querySelectorAll(".search-results tr, .result-table tr");
                const courses: CourseInfo[] = [];

                courseRows.forEach((row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length >= 4) {
                        courses.push({
                            courseId: cells[0]?.textContent?.trim() || "",
                            courseName: cells[1]?.textContent?.trim() || "",
                            instructor: cells[2]?.textContent?.trim() || "",
                            credits: parseInt(cells[3]?.textContent?.trim() || "0"),
                            schedule: cells[4]?.textContent?.trim() || "",
                            status: "available",
                        });
                    }
                });

                return courses;
            });

            return courses;
        } catch (error) {
            console.error("Failed to extract search results:", error);
            return [];
        }
    }

    /**
     * Get grade information
     */
    async getGrades(): Promise<GradeInfo[]> {
        const gradesResult = await this.goToGrades();
        if (!gradesResult.success) return [];

        try {
            const grades = await this.evaluate(() => {
                // Extract grade information from table
                const gradeRows = document.querySelectorAll("table tr:not(:first-child)");
                const grades: GradeInfo[] = [];

                gradeRows.forEach((row) => {
                    const cells = row.querySelectorAll("td");
                    if (cells.length >= 4) {
                        grades.push({
                            courseId: cells[0]?.textContent?.trim() || "",
                            courseName: cells[1]?.textContent?.trim() || "",
                            grade: cells[2]?.textContent?.trim() || "",
                            credits: parseInt(cells[3]?.textContent?.trim() || "0"),
                            semester: cells[4]?.textContent?.trim() || "",
                        });
                    }
                });

                return grades;
            });

            return grades;
        } catch (error) {
            console.error("Failed to extract grades:", error);
            return [];
        }
    }

    /**
     * Get announcements
     */
    async getAnnouncements(): Promise<AnnouncementInfo[]> {
        const announcementsResult = await this.goToAnnouncements();
        if (!announcementsResult.success) return [];

        try {
            const announcements = await this.evaluate(() => {
                // Extract announcements from list
                const announcementItems = document.querySelectorAll(".announcement-item, .notice-item");
                const announcements: AnnouncementInfo[] = [];

                announcementItems.forEach((item, index) => {
                    const title = item.querySelector(".title, .subject")?.textContent?.trim() || "";
                    const content = item.querySelector(".content, .body")?.textContent?.trim() || "";
                    const date = item.querySelector(".date, .timestamp")?.textContent?.trim() || "";
                    const sender = item.querySelector(".sender, .from")?.textContent?.trim() || "";
                    const isRead = !item.classList.contains("unread");

                    announcements.push({
                        id: `announcement-${index}`,
                        title,
                        content,
                        date,
                        sender,
                        isRead,
                    });
                });

                return announcements;
            });

            return announcements;
        } catch (error) {
            console.error("Failed to extract announcements:", error);
            return [];
        }
    }

    /**
     * Register for a course by course ID
     */
    async registerCourse(courseId: string): Promise<ActionResult> {
        const registrationResult = await this.goToCourseRegistration();
        if (!registrationResult.success) return registrationResult;

        try {
            // Search for course
            await this.fill('input[name="courseId"]', courseId);
            await this.click('button[type="submit"]');

            // Wait for course to appear
            await this.waitForElement(`tr[data-course-id="${courseId}"], tr:contains("${courseId}")`);

            // Click register button
            await this.click(`tr[data-course-id="${courseId}"] .register-btn, tr:contains("${courseId}") .register-btn`);

            return {
                success: true,
                message: `Successfully registered for course: ${courseId}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Course registration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Drop a course by course ID
     */
    async dropCourse(courseId: string): Promise<ActionResult> {
        const registrationResult = await this.goToCourseRegistration();
        if (!registrationResult.success) return registrationResult;

        try {
            // Find and click drop button for the course
            await this.click(`tr[data-course-id="${courseId}"] .drop-btn, tr:contains("${courseId}") .drop-btn`);

            // Confirm drop action
            await this.click('button:contains("確認"), button:contains("OK")');

            return {
                success: true,
                message: `Successfully dropped course: ${courseId}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Course drop failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }
}

/**
 * Convenience function to create and initialize portal worker
 */
export async function createPortalWorker(options = {}): Promise<ChkyuoPortalWorker> {
    const worker = new ChkyuoPortalWorker(options);
    await worker.initialize();
    return worker;
}
