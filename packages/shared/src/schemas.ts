import { z } from "zod";

// 基本的な設定スキーマ
export const ConfigSchema = z.object({
  geminiApiKey: z.string().min(1),
  mcpPlaywrightPort: z.number().default(5001),
  mcpPuppeteerPort: z.number().default(5002),
  otelEndpoint: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// 調査対象サイトの設定
export const SiteConfigSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  credentials: z.object({
    username: z.string(),
    password: z.string(),
  }),
  customHeaders: z.record(z.string()).optional(),
  crawlDelay: z.number().default(1000),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// 調査結果のスキーマ
export const InvestigationResultSchema = z.object({
  siteId: z.string(),
  timestamp: z.string(),
  sitemap: z.string(), // Graphviz DOT format
  apiEndpoints: z.array(
    z.object({
      method: z.string(),
      url: z.string(),
      payload: z.record(z.unknown()).optional(),
      response: z.record(z.unknown()).optional(),
    })
  ),
  domStructure: z.array(
    z.object({
      page: z.string(),
      elements: z.array(
        z.object({
          selector: z.string(),
          role: z.string().optional(),
          ariaLabel: z.string().optional(),
          text: z.string().optional(),
        })
      ),
    })
  ),
  authFlow: z.object({
    type: z.enum(["form", "sso", "mfa"]),
    steps: z.array(z.string()),
  }),
  markdownReport: z.string(),
});

export type InvestigationResult = z.infer<typeof InvestigationResultSchema>;

// MCP通信のメッセージスキーマ
export const MCPCommandSchema = z.object({
  id: z.string(),
  method: z.string(),
  params: z.record(z.unknown()),
});

export type MCPCommand = z.infer<typeof MCPCommandSchema>;

// エラーハンドリング
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type AppError = z.infer<typeof ErrorSchema>;
