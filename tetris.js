const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;
let score = 0;
let level = 1;
let gameOver = false;
let isPaused = false;
let dropInterval = 1000;
let lastTime = 0;
let dropCounter = 0;

// 테트리스 블록 모양 정의
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// 색상 정의
const COLORS = [
    '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE138',
    '#3877FF'
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentPosition = { x: 0, y: 0 };

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
    }
}

function createPiece() {
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    return new Piece(SHAPES[randomIndex], COLORS[randomIndex]);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 보드 그리기
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = value;
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });

    // 현재 조각 그리기
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = currentPiece.color;
                    ctx.fillRect(
                        (currentPosition.x + x) * BLOCK_SIZE,
                        (currentPosition.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
}

function collision() {
    return currentPiece.shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const newX = currentPosition.x + x;
            const newY = currentPosition.y + y;
            return newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX];
        });
    });
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPosition.y + y][currentPosition.x + x] = currentPiece.color;
            }
        });
    });
}

function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collision()) {
        currentPiece.shape = previousShape;
    }
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) continue outer;
        }
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        document.getElementById('score').textContent = score;
        if (score >= level * 1000) {
            level++;
            document.getElementById('level').textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

function moveDown() {
    currentPosition.y++;
    if (collision()) {
        currentPosition.y--;
        merge();
        clearLines();
        currentPiece = createPiece();
        currentPosition = { x: Math.floor(COLS / 2) - 1, y: 0 };
        if (collision()) {
            gameOver = true;
        }
    }
    dropCounter = 0;
}

function moveLeft() {
    currentPosition.x--;
    if (collision()) {
        currentPosition.x++;
    }
}

function moveRight() {
    currentPosition.x++;
    if (collision()) {
        currentPosition.x--;
    }
}

function update(time = 0) {
    if (gameOver || isPaused) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        moveDown();
    }
    draw();
    requestAnimationFrame(update);
}

function startGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    currentPiece = createPiece();
    currentPosition = { x: Math.floor(COLS / 2) - 1, y: 0 };
    update();
}

// 키보드 컨트롤
document.addEventListener('keydown', event => {
    if (gameOver || isPaused) return;
    
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
            moveLeft();
            break;
        case 'ArrowRight':
        case 'd':
            moveRight();
            break;
        case 'ArrowDown':
        case 's':
            moveDown();
            break;
        case 'ArrowUp':
        case 'w':
            rotate();
            break;
        case ' ':
            while (!collision()) {
                currentPosition.y++;
            }
            currentPosition.y--;
            merge();
            clearLines();
            currentPiece = createPiece();
            currentPosition = { x: Math.floor(COLS / 2) - 1, y: 0 };
            break;
    }
});

// 버튼 이벤트 리스너
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    if (!isPaused) {
        update();
    }
});
document.getElementById('restart-btn').addEventListener('click', startGame); 