---
applyTo: "packages/mcp-service/**,packages/playwright-worker/**"
---

# Playwright Worker & MCP Service 指示

Implement `src/playwright/login.ts`, `src/playwright/manaboCrawler.ts`, `src/playwright/alboCrawler.ts`.  
Login flow: go to SAML page, fill #username #password, waitForNavigation URL /manabo.cnc/ .  
After successful login call `context.storageState({ path:"state.json" })`.  
Crawler must expose JSON via Express routes `/screenshot`, `/dom`, `/network`.  
Use Playwright `page.route('**/api/**')` to intercept XHR and push meta to an in-memory array.  
For screenshots use `page.screenshot({ fullPage:true })`.  
For DOM snapshot use `await page.content()` then gzip before send.  
Always wrap browser actions in `try-catch`; on failure call `relogin()` then retry once.  
Add `npm:@types/express@latest` for typings and do not import CommonJS versions.  
Emit trace.zip on any unhandled error for offline debugging.  
Ensure every exported function has a JSDoc with `@returns` and `@throws`.
