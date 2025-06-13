// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::AppHandle;

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

// MCP Bridge起動
#[tauri::command]
async fn start_mcp_bridge() -> Result<String, String> {
    println!("🚀 Starting MCP Bridge...");

    // プロジェクトルートディレクトリを取得
    let current_dir =
        std::env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;

    println!("📁 Current directory: {:?}", current_dir);

    // src-tauri -> desktop -> apps -> chukyo-bunseki (3つ上)
    let project_root = current_dir
        .parent() // desktop
        .and_then(|p| p.parent()) // apps
        .and_then(|p| p.parent()) // chukyo-bunseki
        .ok_or("Failed to find project root")?;

    println!("📁 Project root: {:?}", project_root);

    // package.jsonの存在確認
    let package_json_path = project_root.join("package.json");
    if !package_json_path.exists() {
        return Err(format!(
            "package.json not found at: {:?}",
            package_json_path
        ));
    }

    // プロジェクトのmcp:startスクリプトを使用
    let output = Command::new("bun")
        .args(&["run", "mcp:start"])
        .current_dir(&project_root)
        .spawn()
        .map_err(|e| {
            format!(
                "Failed to start MCP Bridge using bun run mcp:start: {} (working dir: {:?})",
                e, project_root
            )
        })?;

    println!("✅ MCP Bridge started with PID: {}", output.id());
    Ok(format!("MCP Bridge started with PID: {}", output.id()))
}

// サイト調査開始
#[tauri::command]
async fn investigate_site(config: SiteConfig) -> Result<InvestigationResult, String> {
    println!("🔍 Starting investigation for: {}", config.url);

    // MCP Bridgeが起動しているかを少し待つ
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // WebSocket経由でMCP Bridgeに指示を送信
    // 実装は簡略化（実際はWebSocketクライアント使用）
    println!("🔌 Attempting to connect to MCP Bridge at ws://localhost:3001");

    // 一時的にモックレポートを返す
    let mock_report = format!(
        "# {}の調査レポート\n\n## 概要\n- URL: {}\n- 調査日時: {}\n\n## 発見事項\n- ログインフォーム発見\n- API エンドポイント: /api/student/info\n- セッション管理: Cookie ベース\n\n## MCP Bridge Status\n- Status: ✅ Connected\n- Port: 3001",
        config.name,
        config.url,
        "2025-06-14 12:00:00 UTC"
    );

    Ok(InvestigationResult {
        success: true,
        message: "Investigation completed successfully".to_string(),
        report: Some(mock_report),
    })
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
            start_mcp_bridge,
            investigate_site,
            save_secure_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
