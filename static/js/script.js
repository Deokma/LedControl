function setCustomColor() {
    // Get the selected color from the iro.js color picker
    var customColor = colorPicker.color.hexString.substring(1);

    // Отправка цвета на сервер
    fetch('/setcolor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            color: customColor
        }),
    })
        .then(response => response.text())
        .then(data => console.log(data));
}

function turnOn() {
    // Отправка запроса на включение ленты
    fetch('/turnon', {
        method: 'POST',
    })
        .then(response => response.text())
        .then(data => console.log(data));
}

function turnOff() {
    // Отправка запроса на выключение ленты
    fetch('/turnoff', {
        method: 'POST',
    })
        .then(response => response.text())
        .then(data => console.log(data));
}
let isRequestPending = false;

function sirenMode() {
    // Проверка, отправляется ли в данный момент запрос
    if (isRequestPending) {
        return;
    }

    isRequestPending = true;

    // Отправка запроса на выключение ленты
    fetch('/siren', {
        method: 'POST',
    })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            updateSirenButtonState(data);
        })
        .finally(() => {
            isRequestPending = false;
        });
}
function stopSiren() {
    // Отправка запроса на выключение сирены
    fetch('/stop_siren', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=stop_siren',
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        updateSirenButtonState(data);
    });
}

function updateSirenButtonState(response) {
    let sirenButton = document.getElementById('sirenButton');
    if (response === "Siren mode activated") {
        sirenButton.classList.remove('btn-primary');
        sirenButton.classList.add('btn-danger');
        // При активации сирены устанавливаем обработчик для кнопки выключения
        sirenButton.onclick = stopSiren;
    } else {
        sirenButton.classList.remove('btn-danger');
        // При выключении сирены убираем обработчик для кнопки выключения
        sirenButton.onclick = sirenMode;
    }
}
