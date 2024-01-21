// Обработчик события изменения цвета в color picker
colorPicker.on('change', (color) => {
    // Обновляем значения RGB-полей в соответствии с выбранным цветом
    document.getElementById('red').value = color.toRGBA()[0];
    document.getElementById('green').value = color.toRGBA()[1];
    document.getElementById('blue').value = color.toRGBA()[2];

    // Здесь вы можете выполнить любые дополнительные действия с новым цветом
    // Например, обновить яркость на основе нового цвета
    updateBrightness(color.toRGBA());
});

// Обработчики событий изменения значений RGB-полей
document.getElementById('red').addEventListener('input', updateColor);
document.getElementById('green').addEventListener('input', updateColor);
document.getElementById('blue').addEventListener('input', updateColor);

// Функция обновления цвета на основе значений RGB-полей
function updateColor() {
    const red = parseInt(document.getElementById('red').value, 10);
    const green = parseInt(document.getElementById('green').value, 10);
    const blue = parseInt(document.getElementById('blue').value, 10);

    // Обновляем цвет в color picker
    colorPicker.setColor([red, green, blue]);

    // Здесь также вы можете выполнить любые дополнительные действия с новым цветом
    // Например, обновить яркость на основе нового цвета
    updateBrightness([red, green, blue]);
}

// Функция обновления яркости на основе цвета
function updateBrightness(rgbValues) {
    // Здесь вы можете использовать значения RGB для обновления яркости
    // Например, если вы используете библиотеку для управления светильником, вызовите соответствующую функцию API
    console.log('Updated brightness based on RGB:', rgbValues);
}
