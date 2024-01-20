// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod light;

use btleplug::api::{
    bleuuid::uuid_from_u16, Central, Manager as _, Peripheral as _, ScanFilter, WriteType,
};
use btleplug::platform::{Adapter, Manager, Peripheral};
use std::error::Error;
use std::time::Duration;
use tokio::time;
use tokio::task;
use uuid::Uuid;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use tauri::{CustomMenuItem, Manager as Manager_tauri, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
static LIGHT: Lazy<Arc<Mutex<Option<Peripheral>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

const LIGHT_CHARACTERISTIC_UUID: Uuid = uuid_from_u16(0xFFF3);
enum TypeOfLedOpetration
{
    POWER,
    COLOR,
    MODES,
    CUSTOM
}
async fn send_data(light: &Peripheral, name: &str, cmd_char: &btleplug::api::Characteristic) -> Result<(), Box<dyn Error>>
{
    // Разбиваем строку name на части по 2 символа и добавляем префикс 0x
    let name_bytes: Vec<u8> = name.as_bytes()
        .chunks(2)
        .map(|chunk| {
            let s = std::str::from_utf8(chunk).unwrap();
            u8::from_str_radix(s, 16).unwrap()
        })
        .collect();

    println!("{}",name_bytes.len());
    let color_cmd = match name_bytes.len() {
        1=> vec![0x7E, 0x04, 0x04, 0x00, 0x00, name_bytes[0], 0xff, 0x00, 0xEF],
        3=> vec![0x7E, 0x07, 0x05, 0x03, name_bytes[0], name_bytes[1], name_bytes[2], 0x10, 0xEF],
        _ => vec![0x7E, 0x07, 0x05, 0x03, name_bytes[0], name_bytes[1], name_bytes[2], 0x10, 0xEF]
    };
    // Используем первые три байта из name_bytes вместо rng.gen()

    light.write(&cmd_char, &color_cmd, WriteType::WithoutResponse).await?;
    Ok(())
}


#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn connect_light() -> Result<(), Box<dyn Error>> {
    let manager = Manager::new().await?;
    let central = manager
        .adapters()
        .await?
        .into_iter()
        .next()
        .ok_or("No adapters found")?;

    central.start_scan(ScanFilter::default()).await?;

    let mut light = None;
    while light.is_none() {
        time::sleep(Duration::from_millis(1000)).await;
        light = light::find_light(&central).await;
    }

    let light = light.unwrap();
    light.connect().await?;
    light.discover_services().await?;

    let mut global_light = LIGHT.lock().unwrap();
    *global_light = Some(light);
    println!("Connected");

    Ok(())
}


#[tauri::command]
fn send_light_data(name: &str) -> Result<(), String> {
    task::block_in_place(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let light = LIGHT.lock().unwrap();
            let light = light.as_ref().ok_or("Light not connected")?;

            let chars = light.characteristics();
            let cmd_char = chars
                .iter()
                .find(|c| c.uuid == LIGHT_CHARACTERISTIC_UUID)
                .ok_or("Unable to find characteristics")?;
            println!("Send data {}", name);
            send_data(light, name, cmd_char).await.map_err(|e| e.to_string())

        })
    })
}


fn main() {
    task::block_in_place(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            if let Err(err) = connect_light().await {
                eprintln!("Error: {:?}", err);
            }
        });
    });

    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let power = CustomMenuItem::new("power".to_string(), "Power");
    //let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(power)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
        //.add_item(hide);
    let tray = SystemTray::new().with_menu(tray_menu);
    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                    let window = app.get_window("main").unwrap();
                        window.show().unwrap();
            }

            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    // "hide" => {
                    //     let window = app.get_window("main").unwrap();
                    //     window.hide().unwrap();
                    // }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet,send_light_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}