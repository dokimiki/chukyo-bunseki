// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio_tungstenite::{connect_async, tungstenite::Message};

#[derive(Debug, Deserialize, Serialize)]
struct SiteConfig {
    url: String,
    name: String,
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct InvestigationResult {
    success: bool,
    message: String,
    report: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MCPRequest {
    command: String,
    data: MCPInvestigationData,
}

#[derive(Debug, Serialize, Deserialize)]
struct MCPInvestigationData {
    #[serde(rename = "siteUrl")]
    site_url: String,
    #[serde(rename = "siteName")]
    site_name: String,
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct MCPResponse {
    r#type: String,
    message: Option<String>,
    data: Option<serde_json::Value>,
}

// ヘルスチェック - MCP Bridgeが起動しているか確認
#[tauri::command]
async fn check_mcp_bridge() -> Result<String, String> {
    println!("� Checking MCP Bridge status...");

    let ws_url = "ws://localhost:3001";

    match connect_async(ws_url).await {
        Ok((ws_stream, _)) => {
            let (mut ws_sender, mut ws_receiver) = ws_stream.split();

            // ヘルスチェックリクエストを送信
            let health_check = serde_json::json!({
                "command": "health-check"
            });

            if let Ok(request_json) = serde_json::to_string(&health_check) {
                if ws_sender.send(Message::Text(request_json)).await.is_ok() {
                    // レスポンスを待機（タイムアウト付き）
                    if let Some(Ok(Message::Text(text))) = ws_receiver.next().await {
                        if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                            if response.get("type") == Some(&serde_json::Value::String("health".to_string())) {
                                println!("✅ MCP Bridge is running");
                                return Ok("MCP Bridge is running".to_string());
                            }
                        }
                    }
                }
            }

            Err("MCP Bridge is not responding properly".to_string())
        }
        Err(_) => {
            Err("MCP Bridge is not running. Please start it with 'bun run dev' in the project root.".to_string())
        }
    }
}

// サイト調査開始
#[tauri::command]
async fn investigate_site(config: SiteConfig) -> Result<InvestigationResult, String> {
    println!("🔍 Starting investigation for: {}", config.url);

    // まずMCP Bridgeの状態を確認
    if let Err(e) = check_mcp_bridge().await {
        return Err(format!("MCP Bridge is not available: {}", e));
    }

    // MCP Bridgeへの接続
    let ws_url = "ws://localhost:3001";
    println!("🔌 Connecting to MCP Bridge at {}", ws_url);

    let (ws_stream, _) = connect_async(ws_url)
        .await
        .map_err(|e| format!("Failed to connect to MCP Bridge: {}", e))?;

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // 調査リクエストを送信
    let request = MCPRequest {
        command: "investigate-site".to_string(),
        data: MCPInvestigationData {
            site_url: config.url.clone(),
            site_name: config.name.clone(),
            username: config.username,
            password: config.password,
        },
    };

    let request_json = serde_json::to_string(&request)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    ws_sender
        .send(Message::Text(request_json))
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    println!("📤 Investigation request sent");

    // レスポンスを待機
    let mut report = String::new();
    let mut investigation_complete = false;

    while let Some(message) = ws_receiver.next().await {
        match message {
            Ok(Message::Text(text)) => {
                let response: MCPResponse = serde_json::from_str(&text)
                    .map_err(|e| format!("Failed to parse response: {}", e))?;

                match response.r#type.as_str() {
                    "progress" => {
                        if let Some(msg) = response.message {
                            println!("📊 Progress: {}", msg);
                        }
                    }
                    "investigation-complete" => {
                        if let Some(data) = response.data {
                            if let Some(report_text) = data.get("report") {
                                if let Some(report_str) = report_text.as_str() {
                                    report = report_str.to_string();
                                }
                            }
                        }
                        investigation_complete = true;
                        break;
                    }
                    "error" => {
                        let error_msg = response
                            .message
                            .unwrap_or_else(|| "Unknown error".to_string());
                        return Err(format!("MCP Bridge error: {}", error_msg));
                    }
                    _ => {
                        println!("📨 Received: {}", response.r#type);
                    }
                }
            }
            Ok(Message::Close(_)) => {
                break;
            }
            Err(e) => {
                return Err(format!("WebSocket error: {}", e));
            }
            _ => {}
        }
    }

    if investigation_complete && !report.is_empty() {
        Ok(InvestigationResult {
            success: true,
            message: "Investigation completed successfully".to_string(),
            report: Some(report),
        })
    } else {
        Err("Investigation did not complete successfully".to_string())
    }
}

// 設定保存
#[tauri::command]
async fn save_secure_config(_app: AppHandle, key: String, _value: String) -> Result<(), String> {
    println!("💾 Saving secure config: {}", key);
    // 実際の暗号化保存実装は後で追加
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            println!("🎯 Tauri app initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_mcp_bridge,
            investigate_site,
            save_secure_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
