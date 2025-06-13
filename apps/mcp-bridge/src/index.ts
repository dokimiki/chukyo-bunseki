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

const PORT = Number(process.env.PORT) || 3001;

// ポートが使用中の場合のエラーハンドリング
const wss = new WebSocketServer({
  port: PORT,
  host: "localhost",
});

wss.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please stop other MCP Bridge instances.`
    );
    process.exit(1);
  } else {
    console.error("❌ WebSocket server error:", error);
    throw error;
  }
});

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
    console.log("📡 Sending progress update: MCPクライアントに接続中...");
    ws.send(
      JSON.stringify({
        type: "progress",
        message: "MCPクライアントに接続中...",
      })
    );

    console.log("🔌 Connecting to MCP client...");
    await mcpClient.connect();
    console.log("✅ MCP client connected successfully");

    console.log("📡 Sending progress update: サイトにログイン中...");
    ws.send(
      JSON.stringify({ type: "progress", message: "サイトにログイン中..." })
    );

    console.log("🌐 Starting site exploration...");
    const explorationData = await mcpClient.exploreSite(data);
    console.log("✅ Site exploration completed");

    // Geminiで分析
    console.log("📡 Sending progress update: AI分析中...");
    ws.send(JSON.stringify({ type: "progress", message: "AI分析中..." }));

    console.log("🤖 Starting Gemini analysis...");
    const report = await geminiService.generateReport(explorationData);
    console.log("✅ Gemini analysis completed");

    // 結果返送
    console.log("📤 Sending investigation results...");
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

    // 成功時もブラウザをクリーンアップ
    try {
      await mcpClient.disconnect();
      console.log("🧹 Browser cleanup completed");
    } catch (cleanupError) {
      console.error("❌ Browser cleanup failed:", cleanupError);
    }
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    console.error("❌ Investigation failed:", error);
    console.error("❌ Error stack:", (error as Error).stack);

    // ブラウザをクリーンアップ
    try {
      await mcpClient.disconnect();
      console.log("🧹 Browser cleanup completed");
    } catch (cleanupError) {
      console.error("❌ Browser cleanup failed:", cleanupError);
    }

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

// グレースフルシャットダウン
process.on("SIGINT", () => {
  console.log("🛑 Shutting down MCP Bridge...");
  wss.close(() => {
    console.log("✅ MCP Bridge shutdown complete");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 Shutting down MCP Bridge...");
  wss.close(() => {
    console.log("✅ MCP Bridge shutdown complete");
    process.exit(0);
  });
});
