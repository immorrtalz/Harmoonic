// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use window_vibrancy::*;
use window_shadows::*;

#[derive(Clone, serde::Serialize)]
struct Payload
{
	args: Vec<String>,
	cwd: String
}

fn main()
{
	tauri::Builder::default()
		.plugin(tauri_plugin_single_instance::init(|app, argv, cwd|
		{
			app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
		}))
		.setup(|app|
		{
			let window = app.get_window("main").unwrap();
			set_shadow(&window, true).unwrap();
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![winacrylic, getexepath])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
fn winacrylic(window: tauri::Window)
{
	apply_acrylic(&window, Some((0, 0, 0, 0))).unwrap();
}

#[tauri::command]
fn getexepath() -> String
{
	std::env::current_exe().unwrap().display().to_string()
}