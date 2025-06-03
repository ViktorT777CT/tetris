// Настройки игры
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const blockSize = 20;
const rows = 20;
const cols = 10;

// Игровое поле
let grid = Array(rows).fill().map(() => Array(cols).fill(0));

// Фигуры Тетриса (черно-белые)
const shapes = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// Текущая фигура
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;

// Счет и уровень
let score = 0;
let level = 1;
let myBestScore = localStorage.getItem('myBestScore') || 0;
let topPlayer = localStorage.getItem('topPlayer') || '-';
let topScore = localStorage.getItem('topScore') || 0;

// Скорость падения (мс)
let dropInterval = 1000; // Начальная скорость: 1 секунда
let lastTime = 0;
let gameOverFlag = false;

// Элементы управления
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const rotateBtn = document.getElementById('rotate-btn');
const downBtn = document.getElementById('down-btn');

// Обновление таблицы рекордов
function updateLeaderboard() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('my-best').textContent = myBestScore;
    document.getElementById('top-player').textContent = topPlayer;
    document.getElementById('top-score').textContent = topScore;
}

// Создание новой фигуры
function newPiece() {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    currentPiece = shape;
    currentX = Math.floor(cols / 2) - Math.floor(shape[0].length / 2);
    currentY = 0;
    currentRotation = 0;

    // Проверка на проигрыш
    if (collision()) {
        gameOver();
    }
}

// Проверка столкновений
function collision() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x] !== 0) {
                const newX = currentX + x;
                const newY = currentY + y;

                if (
                    newX < 0 ||
                    newX >= cols ||
                    newY >= rows ||
                    (newY >= 0 && grid[newY][newX] !== 0)
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Фиксация фигуры на поле
function lockPiece() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x] !== 0) {
                if (currentY + y >= 0) {
                    grid[currentY + y][currentX + x] = 1;
                }
            }
        }
    }

    // Проверка заполненных линий
    clearLines();

    // Новая фигура
    newPiece();
}

// Очистка заполненных линий
function clearLines() {
    let linesCleared = 0;
    for (let y = rows - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(cols).fill(0));
            linesCleared++;
            y++; // Проверить ту же линию снова
        }
    }

    // Увеличение счета (1 очко за линию)
    if (linesCleared > 0) {
        score += linesCleared * 1;

        // Увеличение уровня каждые 20 очков
        const newLevel = Math.floor(score / 20) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100); // Увеличиваем скорость
        }

        updateLeaderboard();
    }
}

// Отрисовка игры
function draw() {
    // Очистка поля
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Отрисовка сетки (светлая версия блоков)
    ctx.strokeStyle = '#ddd'; // Светло-серый цвет для сетки
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Размеры и отступы (аналогично стилю фигур)
            const blockGap = 1;    // Белый отступ между клетками
            const borderSize = 1;   // Толщина серой рамки
            const innerPadding = 2; // Отступ внутренней белой области
            const innerSize = 12;   // Размер центрального квадрата

            // 1. Белый фон для отступов между клетками
            ctx.fillStyle = 'white';
            ctx.fillRect(
                x * blockSize,
                y * blockSize,
                blockSize,
                blockSize
            );

            // 2. Серая рамка (с отступом от границ)
            ctx.fillStyle = '#ddd';
            ctx.fillRect(
                x * blockSize + blockGap,
                y * blockSize + blockGap,
                blockSize - blockGap * 2,
                blockSize - blockGap * 2
            );

            // 3. Белая внутренняя область
            ctx.fillStyle = 'white';
            ctx.fillRect(
                x * blockSize + blockGap + borderSize,
                y * blockSize + blockGap + borderSize,
                blockSize - (blockGap + borderSize) * 2,
                blockSize - (blockGap + borderSize) * 2
            );

            // 4. Светло-серый центральный квадрат
            ctx.fillStyle = '#eee';
            ctx.fillRect(
                x * blockSize + (blockSize - innerSize) / 2,
                y * blockSize + (blockSize - innerSize) / 2,
                innerSize,
                innerSize
            );
        }
    }

    // Отрисовка стакана (зафиксированные фигуры)
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] !== 0) {
                // Отступ между блоками (1 пиксель)
                const blockGap = 1;

                // Черная рамка (учитываем отступ между блоками)
                ctx.fillStyle = 'black';
                ctx.fillRect(
                    x * blockSize + blockGap,
                    y * blockSize + blockGap,
                    blockSize - blockGap * 2,
                    blockSize - blockGap * 2
                );

                // Белый внутренний прямоугольник с отступом
                ctx.fillStyle = 'white';
                const padding = 2; // Размер отступа от черной рамки
                ctx.fillRect(
                    x * blockSize + blockGap + padding,
                    y * blockSize + blockGap + padding,
                    blockSize - (blockGap + padding) * 2,
                    blockSize - (blockGap + padding) * 2
                );

                // Черный внутренний квадрат
                ctx.fillStyle = 'black';
                const innerSize = 12; // Размер внутреннего квадрата
                ctx.fillRect(
                    x * blockSize + (blockSize - innerSize) / 2,
                    y * blockSize + (blockSize - innerSize) / 2,
                    innerSize,
                    innerSize
                );
            }
        }
    }

    // Отрисовка текущей фигуры
    if (currentPiece) {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x] !== 0) {

                    // Отступ между блоками (1 пиксель)
                    const blockGap = 1;
                    // Черная рамка
                    ctx.fillStyle = 'black';
                    ctx.fillRect(
                        (currentX + x) * blockSize + blockGap,
                        (currentY + y) * blockSize + blockGap,
                        blockSize - blockGap * 2,
                        blockSize - blockGap * 2
                    );

                    // Белый внутренний прямоугольник с отступом
                    ctx.fillStyle = 'white';
                    const padding = 2;
                    ctx.fillRect(
                        (currentX + x) * blockSize + blockGap + padding,
                        (currentY + y) * blockSize + blockGap + padding,
                        blockSize - (blockGap + padding) * 2,
                        blockSize - (blockGap + padding) * 2
                    );

                    // Черный внутренний квадрат
                    ctx.fillStyle = 'black';
                    const innerSize = 12;
                    ctx.fillRect(
                        (currentX + x) * blockSize + (blockSize - innerSize) / 2,
                        (currentY + y) * blockSize + (blockSize - innerSize) / 2,
                        innerSize,
                        innerSize
                    );
                }
            }
        }
    }
}

// Движение влево
function moveLeft() {
    currentX--;
    if (collision()) currentX++;
    draw();
}

// Движение вправо
function moveRight() {
    currentX++;
    if (collision()) currentX--;
    draw();
}

// Движение вниз
function moveDown() {
    currentY++;
    if (collision()) {
        currentY--;
        lockPiece();
    }
    draw();
}

// Быстрое падение
function hardDrop() {
    while (!collision()) {
        currentY++;
    }
    currentY--;
    lockPiece();
    draw();
}

// Вращение фигуры
function rotatePiece() {
    const rotated = currentPiece[0].map((_, i) =>
        currentPiece.map(row => row[i]).reverse()
    );
    const oldPiece = currentPiece;
    currentPiece = rotated;
    if (collision()) {
        currentPiece = oldPiece;
    }
    draw();
}

// Игровой цикл
function gameLoop(time = 0) {
    if (gameOverFlag) return;
    if (time - lastTime > dropInterval) {
        moveDown();
        lastTime = time;
    }
    requestAnimationFrame(gameLoop);
}

// Конец игры
function gameOver() {
    gameOverFlag = true;
    alert(`Игра окончена! Ваш счет: ${score}`);

    // Обновление рекордов
    if (score > myBestScore) {
        myBestScore = score;
        localStorage.setItem('myBestScore', myBestScore);
    }

    if (score > topScore) {
        topScore = score;
        topPlayer = "Вы";
        localStorage.setItem('topScore', topScore);
        localStorage.setItem('topPlayer', topPlayer);
    }

    // Сброс игры
    grid = Array(rows).fill().map(() => Array(cols).fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameOverFlag = false;
    updateLeaderboard();
    newPiece();
    draw();
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

// Назначение обработчиков кнопок
leftBtn.addEventListener('click', moveLeft);
rightBtn.addEventListener('click', moveRight);
rotateBtn.addEventListener('click', rotatePiece);
downBtn.addEventListener('click', hardDrop);

// Назначение обработчиков клавиатуры
document.addEventListener('keydown', (e) => {
    if (!currentPiece || gameOverFlag) return;

    switch (e.key) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': hardDrop(); break; // Пробел для мгновенного падения
    }
});

// Запуск игры
updateLeaderboard();
newPiece();
draw();
gameLoop();

// Интеграция с Telegram
Telegram.WebApp.expand();
Telegram.WebApp.enableClosingConfirmation();