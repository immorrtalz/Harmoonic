/* use core::result::Result;
use std::path::PathBuf;
use tauri::Error;
#[cfg(target_os = "android")]
use jni;
use android_activity::AndroidApp;
use android_activity;

[target."cfg(target_os = \"android\")".dependencies]
jni = "0.21.1"
android-activity = { version = "0.6.0", features = ["native-activity"] } */

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String
{
	format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(/* app: AndroidApp */)
{
	tauri::Builder::default()
		.plugin(tauri_plugin_shell::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_dialog::init())
		/* .plugin(tauri_plugin_cli::init()) */
		.plugin(tauri_plugin_os::init())
		.invoke_handler(tauri::generate_handler![greet])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

/* FOLDER PICKER --------------------------------------------------------- */

/* #[tauri::command]
fn select_directory() -> Result<PathBuf, Error>
{
	if cfg!(target_os = "android")
	{
		select_directory_android()
	}
	else
	{
		println!("select_directory(): target_os isn't android");
	}
}

#[cfg(target_os = "android")]
fn select_directory_android() -> Result<PathBuf, Error>
{
	use jni::objects::{JClass, JString};
	use jni::JNIEnv;
	use android_activity::native_activity;
	use std::ffi::CString;
	use std::sync::Once;

	static INIT: Once = Once::new();
	static mut SELECTED_DIRECTORY: Option<PathBuf> = None;

	#[no_mangle]
	pub extern "system" fn Java_com_tauri_dev_DirectoryPickerActivity_sendDirectoryPathToRust(
		env: JNIEnv,
		_class: JClass,
		directory_path: &JString
	)
	{
		let path: String = env
			.get_string(directory_path)
			.expect("Couldn't get directory path")
			.into();

		unsafe
		{
			SELECTED_DIRECTORY = Some(PathBuf::from(path));
		}
	}

	// Invoke Android activity to pick a directory
	let activity = native_activity();
	let vm = activity.vm();
	let _env = vm.attach_current_thread().unwrap();

	let class_name = CString::new("com/EVERMEDIAPROJECT/Harmoonic/DirectoryPickerActivity").unwrap();
	let activity_class = _env.find_class(class_name.as_c_str()).unwrap();
	let intent_method_id = _env
		.get_method_id(activity_class, "startActivity", "()V")
		.unwrap();

	_env.call_method(activity_class, intent_method_id, "()V", &[]).unwrap();

	// Return the selected directory path or an error if not selected
	unsafe
	{
		match &SELECTED_DIRECTORY
		{
			Some(path) => Ok(path.clone()),
			None => Err(Error::from("No directory selected")),
		}
	}
} */