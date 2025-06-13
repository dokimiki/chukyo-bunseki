import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

// OpenTelemetry初期化
const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter: new JaegerExporter({
    endpoint:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      "http://localhost:14268/api/traces",
  }),
});

sdk.start();

const tracer = trace.getTracer("mcp-bridge", "0.1.0");

import { MCPClient } from "./mcp-client";
import { GeminiService } from "./gemini-service";
import { WebSocketServer } from "ws";

console.log("🚀 MCP Bridge starting...");

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

const mcpClient = new MCPClient();
const geminiService = new GeminiService();

wss.on("connection", ws => {
  console.log("📱 GUI connected to MCP Bridge");

  ws.on("message", async data => {
    const span = tracer.startSpan("handle-message");

    try {
      const message = JSON.parse(data.toString());
      console.log("📨 Received:", message.command);

      switch (message.command) {
        case "investigate-site":
          await handleSiteInvestigation(ws, message.data, span);
          break;
        case "health-check":
          ws.send(JSON.stringify({ type: "health", status: "ok" }));
          break;
        default:
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Unknown command: ${message.command}`,
            })
          );
      }
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      console.error("❌ Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: (error as Error).message,
        })
      );
    } finally {
      span.end();
    }
  });

  ws.on("close", () => {
    console.log("📱 GUI disconnected from MCP Bridge");
  });
});

async function handleSiteInvestigation(ws: any, data: any, parentSpan: any) {
  const span = tracer.startSpan(
    "site-investigation",
    undefined,
    parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
  );

  try {
    console.log("🔍 Starting site investigation:", data.siteUrl);

    // MCPでサイト探索
    ws.send(
      JSON.stringify({
        type: "progress",
        message: "MCPクライアントに接続中...",
      })
    );
    await mcpClient.connect();

    ws.send(
      JSON.stringify({ type: "progress", message: "サイトにログイン中..." })
    );
    const explorationData = await mcpClient.exploreSite(data);

    // Geminiで分析
    ws.send(JSON.stringify({ type: "progress", message: "AI分析中..." }));
    const report = await geminiService.generateReport(explorationData);

    // 結果返送
    ws.send(
      JSON.stringify({
        type: "investigation-complete",
        data: {
          report,
          explorationData,
          timestamp: new Date().toISOString(),
        },
      })
    );

    console.log("✅ Investigation completed successfully");
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    console.error("❌ Investigation failed:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: `Investigation failed: ${(error as Error).message}`,
      })
    );
  } finally {
    span.end();
  }
}

console.log(`🌟 MCP Bridge ready on ws://localhost:${PORT}`);
