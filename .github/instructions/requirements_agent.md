# Gemini 要件定義エージェント指示
Use @google-ai/generative SDK; set safety settings to "BLOCK_NONE".  
Accept CLI prompt text, call MCP endpoints, feed screenshots + DOM to Gemini with JSON mode.  
Ask Gemini: “Output Markdown spec with headings ### 画面名 and tables listing id, selector, text.”  
Return Gemini JSON like `{ markdown: "..." }` then write to `specs/{date}/site-spec.md`.  
If DOM > 200 KB, chunk by `<section>` tags and send sequentially to Gemini.  
Never log sensitive cookies or passwords.  
On HTTP 429 retry with exponential back-off starting at 2 s.  
All prompts must include: “Respond in Japanese.”  
Include short summary (≤120 chars) at top of generated Markdown.  
Cache Gemini response keyed by URL + hash(dom) for 24 h to avoid re-billing.  
Use `cmd-ts` for CLI entry: `bunx ts-node src/cli.ts gen-spec --target manabo --page timetable`.  
