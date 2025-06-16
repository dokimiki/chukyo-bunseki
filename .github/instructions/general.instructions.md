---
applyTo: "**"
---

# 共通規約

Use Bun ≥1.1, TypeScript strict mode, ESM imports only.  
Always resolve Node/Bun 互換差分 when importing Playwright libs:contentReference[oaicite:5]{index=5}.  
Generate code that passes `bun test --coverage`.  
Follow Airbnb JavaScript style except 2-space indent & single quotes.  
Use Playwright tracing (`context.tracing.start({ screenshots:true, snapshots:true })`) for debug flows:contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}.  
Persist login with `context.storageState({ path:"state.json" })` and reload with `launchPersistentContext({ storageState:"state.json" })`:contentReference[oaicite:8]{index=8}:contentReference[oaicite:9]{index=9}.  
When Bun incompatibility appears, suggest fallback to `node` shim flag `--bun` plus polyfills as per Playwright-Bun issue #27139:contentReference[oaicite:10]{index=10}.  
Prefer async/await, never callbacks.  
All new files must contain ESLint header `/* eslint-disable functional/no-class */`.
