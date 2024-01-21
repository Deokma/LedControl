use btleplug::api::{
     Central, Peripheral as _
};
use btleplug::platform::{Adapter, Peripheral};

pub async fn find_light(central: &Adapter) -> Option<Peripheral> {
    for p in central.peripherals().await.unwrap() {
        if p.properties()
            .await
            .unwrap()
            .unwrap()
            .local_name
            .iter()
            .any(|name| name.contains("ELK-BLEDOM"))
        {
            return Some(p);
        }
    }
    None
}
