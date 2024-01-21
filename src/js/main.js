const { invoke } = window.__TAURI__.tauri;

let sendLightEl;
let sendLightMsgEl;
let colorPicker;
let sendBrightlessEl;

const requestQueue = [];

function updateColorPickerFromRGB() {
  const redInput = document.getElementById('red');
  const greenInput = document.getElementById('green');
  const blueInput = document.getElementById('blue');

  const red = redInput.value.trim() === '' ? 0 : parseInt(redInput.value, 10);
  const green = greenInput.value.trim() === '' ? 0 : parseInt(greenInput.value, 10);
  const blue = blueInput.value.trim() === '' ? 0 : parseInt(blueInput.value, 10);

  colorPicker.color.rgb = { r: red, g: green, b: blue };

  // Обновление цвета фона инпута в зависимости от значения
  redInput.style.backgroundColor = `rgb(${red}, 0, 0)`;
  greenInput.style.backgroundColor = `rgb(0, ${green}, 0)`;
  blueInput.style.backgroundColor = `rgb(0, 0, ${blue})`;
}

async function send_light_data() {
  try {
    updateColorPickerFromRGB();

    let color = colorPicker.color.hexString.substring(1);

    // Добавление текущего запроса в очередь
    requestQueue.push(invoke("send_light_data", { name: color, lightCommand: "color" }));

    // Ограничение очереди хранением только последних 3 запросов
    if (requestQueue.length > 3) {
      requestQueue.shift(); // Удаление самого старого запроса
    }

    // Ожидание завершения последнего запроса и обновление сообщения
    sendLightMsgEl.textContent = await requestQueue[requestQueue.length - 1];
  } catch (err) {
    sendLightMsgEl.textContent = "Error: " + err;
  }
}
async function send_styles_data(buttonCode) {
  try {
    // Adding the current request to the queue
    requestQueue.push(invoke("send_light_data", { name: buttonCode, lightCommand: "styles" }));

    // Limiting the queue to store only the last 3 requests
    if (requestQueue.length > 3) {
      requestQueue.shift(); // Removing the oldest request
    }

    // Waiting for the completion of the last request and updating the message
    sendLightMsgEl.textContent = await requestQueue[requestQueue.length - 1];
  } catch (err) {
    sendLightMsgEl.textContent = "Error: " + err;
  }
}
let isOn = false;
let powerButton = document.querySelector('.power-button');

async function send_light_off_on_data() {
  try {
    //updateColorPickerFromRGB();

    let dataToSend = isOn ? "00" : "01";

    // Добавление текущего запроса в очередь
    requestQueue.push(invoke("send_light_data", { name: dataToSend, lightCommand: "power" }));

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
async function send_brightness_data() {
  try {
    // Получение значения яркости (например, от 1 до 100)
    let brightnessValue = parseInt(document.getElementById('numberRange').value, 10);

    // Преобразование значения яркости в строку Hex
    let brightnessHex = brightnessValue.toString(16).padStart(2, '0');
    console.log(`Введенное число: ${brightnessValue}`);
    // Добавление текущего запроса в очередь с значением яркости Hex в виде строки
    requestQueue.push(invoke("send_light_data", { name: brightnessHex,lightCommand: "brightness" }));

    // Ограничение очереди хранением только последних 3 запросов
    if (requestQueue.length > 3) {
      requestQueue.shift(); // Удаление самого старого запроса
    }

    // Ожидание завершения последнего запроса и обновление сообщения
    sendLightMsgEl.textContent = await requestQueue[requestQueue.length - 1];
  } catch (err) {
    sendLightMsgEl.textContent = "Error: " + err;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  sendLightEl = document.querySelector("#send-light-data-form");
  sendLightMsgEl = document.querySelector("#send-light-data-msg");

  document.querySelector("#send-light-data-form").addEventListener("submit", (e) => {
    e.preventDefault();
    send_light_off_on_data();
  });

  // Добавьте обработчик события для изменения ползунка
  let numberRange = document.getElementById('numberRange');
  if (numberRange) {
    numberRange.addEventListener('input', function() {
      // Обновление текста с выбранным значением
      document.getElementById('selectedValue').textContent = this.value;

      // Вызов функции для отправки данных яркости
      send_brightness_data();
    });
  } else {
    console.error("Element with id 'numberRange' not found.");
  }

  colorPicker = new iro.ColorPicker('#color-picker', {
    width: 300,
    layout: [
      {
        component: iro.ui.Wheel,
        options: {}
      },
    ]
  });

  colorPicker.on("color:change", function() {
    document.getElementById('red').value = colorPicker.color.rgb.r;
    document.getElementById('green').value = colorPicker.color.rgb.g;
    document.getElementById('blue').value = colorPicker.color.rgb.b;

    send_light_data();
  });

  // Добавление обработчиков событий изменения значений RGB-полей
  document.getElementById('red').addEventListener('input', function() {
    updateColorPickerFromRGB();
    send_light_data();
  });
  document.getElementById('green').addEventListener('input', function() {
    updateColorPickerFromRGB();
    send_light_data();
  });
  document.getElementById('blue').addEventListener('input', function() {
    updateColorPickerFromRGB();
    send_light_data();
  });
});

function handleTabClick(tab, index, tabs, tabContents) {
  tab.addEventListener('click', () => {
    // Hide all tab contents
    tabContents.forEach(content => content.style.display = 'none');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show the selected tab content
    tabContents[index].style.display = 'block';
    tab.classList.add('active');
  });
}

// Function to handle button click
function handleButtonClick(event) {
  const code = event.target.getAttribute('data-code');
  // Implement the logic to do something with the selected code
  console.log('Selected code:', code);

  // Call the function to send button data
  send_styles_data(code);
}

// Function to initialize the page
function initializePage() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    handleTabClick(tab, index, tabs, tabContents);
  });

  // Fetch the JSON data
  const stylesButtonsContainer = document.getElementById('styles-buttons');
  fetch('../assets/styles.json')
      .then(response => response.json())
      .then(data => {
        // Create buttons based on the parsed data
        data.forEach(command => {
          const button = document.createElement('button');
          button.textContent = command.name;
          button.setAttribute('data-code', command.code);
          button.addEventListener('click', handleButtonClick);
          stylesButtonsContainer.appendChild(button);
        });
      })
      .catch(error => console.error('Error fetching JSON:', error));

  // Set the initial active tab and content
  const initialTab = document.getElementById('tab_adjust');
  initialTab.classList.add('active');
  initialTab.style.display = 'block';
}
document.addEventListener('DOMContentLoaded', initializePage);