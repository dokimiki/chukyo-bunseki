// Main exports for playwright-worker package

// Login functionality
export { loginToChukyoManabo as loginToChukyo, createAuthenticatedContext, type LoginOptions, type LoginResult } from "./login.js";

// Core automation functionality
export { ChkyuoAutomationWorker, createAutomationWorker, type AutomationOptions, type PageInfo, type ActionResult } from "./automation.js";

// Portal-specific functionality
export { ChkyuoPortalWorker, createPortalWorker } from "./portal.js";

// Integration with requirements analysis
export { ChkyuoIntegrationWorker, createIntegrationWorker, type PageAnalysisResult } from "./integration.js";
