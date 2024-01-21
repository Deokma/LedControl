// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod light;

use btleplug::api::{
    bleuuid::uuid_from_u16, Central, Manager as _, Peripheral as _, ScanFilter, WriteType,
};
use btleplug::platform::{Manager, Peripheral};
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

fn convert_brightness_to_hex(value: u8) -> Vec<u8> {
    vec![value]
}
async fn send_data(light: &Peripheral, name: &str,light_command: &str, cmd_char: &btleplug::api::Characteristic) -> Result<(), Box<dyn Error>>
{
    // Разбиваем строку name на части по 2 символа и добавляем префикс 0x
    let name_bytes: Vec<u8> = name.as_bytes()
        .chunks(2)
        .map(|chunk| {
            let s = std::str::from_utf8(chunk).unwrap();
            u8::from_str_radix(s, 16).unwrap()
        })
        .collect();

    println!("Name bytes.len: {}",name_bytes.len());
    println!("Name_bytes[0]: {}",name_bytes[0].to_ascii_lowercase());
    let color_cmd = match light_command {
        "power"=> vec![0x7E, 0x04, 0x04, 0x00, 0x00, name_bytes[0], 0xff, 0x00, 0xEF],
        "color"=> vec![0x7E, 0x07, 0x05, 0x03, name_bytes[0], name_bytes[1], name_bytes[2], 0x10, 0xEF],
        "brightness" => {
            let brightness_value = name_bytes[0]; // Здесь предполагается, что значение яркости - первый байт
            let brightness_hex = convert_brightness_to_hex(brightness_value);
            println!("{}",brightness_hex[0]);
            vec![0x7E, 0x04, 0x01, brightness_hex[0], 0xff, 0xff, 0xff, 0x00, 0xEF]
        },
        "styles"=> vec![0x7E, 0x05, 0x03, name_bytes[0], 0x03, 0xff, 0xff, 0x00, 0xEF],
        _ => vec![0x7E, 0x07, 0x05, 0x03, 0xff, 0xff, 0xff, 0x10, 0xEF]
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
fn send_light_data(name: &str,light_command: &str) -> Result<(), String> {
    task::block_in_place(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let light = LIGHT.lock().unwrap();
            let light = light.as_ref().ok_or("Light not connected")?;

            let chars = light.characteristics();
            let cmd_char = chars
                .iter()
                .find(|c| c.uuid == LIGHT_CHARACTERISTIC_UUID)
                .ok_or("Unable to find characteristics")?;
            println!("Send data {}", light_command);
            send_data(light, name, light_command, cmd_char).await.map_err(|e| e.to_string())
        })
    })
}


fn main() {
    let power_indicate = Arc::new(Mutex::new(false));
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
    let power_indicate_clone = Arc::clone(&power_indicate);
    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(move|app, event| match event {
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
                    "power" => {
                        let mut power_indicate = power_indicate_clone.lock().unwrap();
                        match *power_indicate {
                            false => {
                                *power_indicate = true;
                                let _ = send_light_data("01", "power");
                            },
                            true => {
                                *power_indicate = false;
                                let _ = send_light_data("00", "power");
                            }
                        }
                    }
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