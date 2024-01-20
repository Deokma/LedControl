const { invoke } = window.__TAURI__.tauri;

let sendLightEl;
let sendLightMsgEl;

const requestQueue = [];

async function send_light_data() {
  try {
    let color = colorPicker.color.hexString.substring(1);

    // Add the current request to the queue
    requestQueue.push(invoke("send_light_data", { name: color }));

    // Limit the queue to store only the latest 3 requests
    if (requestQueue.length > 3) {
      requestQueue.shift(); // Remove the oldest request
    }

    // Wait for the latest request to complete and update the message
    sendLightMsgEl.textContent = await requestQueue[requestQueue.length - 1];
  } catch (err) {
    sendLightMsgEl.textContent = "Error: " + err;
  }
}

let isOn = false; // Переменная для отслеживания состояния света
let powerButton = document.querySelector('.power-button'); // Получение кнопки

async function send_light_off_on_data() {
  try {
    let dataToSend = isOn ? "00" : "01"; // Определение данных для отправки на основе состояния света

    // Добавление текущего запроса в очередь
    requestQueue.push(invoke("send_light_data", { name: dataToSend }));

    // Ограничение очереди хранением только последних 3 запросов
    if (requestQueue.length > 3) {
      requestQueue.shift(); // Удаление самого старого запроса
    }

    // Ожидание завершения последнего запроса и обновление сообщения
    sendLightMsgEl.textContent = await requestQueue[requestQueue.length - 1];

    // Переключение состояния света
    isOn = !isOn;

    // Обновление цвета кнопки в зависимости от состояния света
    if (isOn) {
      powerButton.classList.add('on');
    } else {
      powerButton.classList.remove('on');
    }
  } catch (err) {
    sendLightMsgEl.textContent = "Error: " + err;
  }
}



window.addEventListener("DOMContentLoaded", () => {
  sendLightEl = document.querySelector("#send-light-data-form");
  sendLightMsgEl = document.querySelector("#send-light-data-msg");

  document.querySelector("#send-light-data-form").addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("sdsadwad")
    send_light_off_on_data();
  });
});

async function setCustomColor() {
  var customColor = colorPicker.color.hexString.substring(1);

  try {
    await invoke("set_color", { color: customColor });
    console.log("Color sent successfully");
  } catch (err) {
    console.error("Error sending color: " + err);
  }
}

var colorPicker = new iro.ColorPicker('#color-picker', {
  width: 300,
  layout: [
    {
      component: iro.ui.Wheel,
      options: {}
    },
  ]
});
colorPicker.on("color:change", function() {
  send_light_data();
});
