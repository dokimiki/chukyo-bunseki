import { describe, it, expect } from "vitest";
import { ConfigSchema, SiteConfigSchema } from "@chukyo-bunseki/shared";

describe("Schema Validation", () => {
  it("should validate Config schema", () => {
    const validConfig = {
      geminiApiKey: "test-key",
      mcpPlaywrightPort: 5001,
      mcpPuppeteerPort: 5002,
    };

    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should validate SiteConfig schema", () => {
    const validSiteConfig = {
      url: "https://example.com",
      name: "Test Site",
      credentials: {
        username: "testuser",
        password: "testpass",
      },
    };

    const result = SiteConfigSchema.safeParse(validSiteConfig);
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL in SiteConfig", () => {
    const invalidSiteConfig = {
      url: "not-a-url",
      name: "Test Site",
      credentials: {
        username: "testuser",
        password: "testpass",
      },
    };

    const result = SiteConfigSchema.safeParse(invalidSiteConfig);
    expect(result.success).toBe(false);
  });
});
