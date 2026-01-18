// src-tauri/src/lib.rs
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
// Import plugin shortcut
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};
// Import sysinfo (Logic CPU/RAM)
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::State;

// --- PHẦN 1: CẤU TRÚC DỮ LIỆU SYSINFO ---
struct SystemState {
    sys: Mutex<System>,
}

#[derive(serde::Serialize)]
struct SystemStats {
    cpu: f32,
    mem_used: u64,
    mem_total: u64,
}

// --- PHẦN 2: CÁC COMMAND ---

// Command 1: Lấy thông số hệ thống
#[tauri::command]
fn get_system_stats(state: State<SystemState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();

    sys.refresh_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );

    let cpus = sys.cpus();
    let cpu_count = cpus.len() as f32;
    let mut total_cpu_usage = 0.0;

    for cpu in cpus {
        total_cpu_usage += cpu.cpu_usage();
    }

    let cpu_usage = if cpu_count > 0.0 {
        total_cpu_usage / cpu_count
    } else {
        0.0
    };

    let mem_used = sys.used_memory();
    let mem_total = sys.total_memory();

    SystemStats {
        cpu: cpu_usage,
        mem_used,
        mem_total,
    }
}

// Command 2: Ẩn cửa sổ (Gọi từ nút X ở React)
#[tauri::command]
fn hide_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

// Hàm phụ: Toggle cửa sổ (Dùng cho phím tắt)
fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

// --- PHẦN 3: HÀM RUN CHÍNH ---
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Khởi tạo System cho sysinfo
    let sys = System::new_all();

    tauri::Builder::default()
        // 1. Quản lý State (Sysinfo)
        .manage(SystemState {
            sys: Mutex::new(sys),
        })
        // 2. Khởi tạo các Plugin cơ bản
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build()) // <--- Thêm dòng này
        .plugin(tauri_plugin_process::init()) // <--- Thêm dòng này để restart app
        // 3. Cấu hình Global Shortcut (Ctrl + Shift + Space)
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(tauri_plugin_global_shortcut::Shortcut::new(
                    Some(Modifiers::CONTROL | Modifiers::SHIFT),
                    Code::Space,
                ))
                .unwrap()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::Space) {
                            toggle_main_window(app);
                        }
                    }
                })
                .build(),
        )
        // 4. Setup (Tạo thư mục data nếu chưa có)
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
                println!("System: Created app data directory at: {:?}", app_data_dir);
            }
            Ok(())
        })
        // 5. Đăng ký TẤT CẢ command tại đây
        .invoke_handler(tauri::generate_handler![get_system_stats, hide_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
