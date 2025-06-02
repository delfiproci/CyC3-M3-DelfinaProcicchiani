// Game constants
const GAME_SPEED = 3;
const PLAYER_SPEED = 8;
const SPAWN_RATE = 1200;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 80;
const OBJECT_SIZE = 40;
const WIN_SCORE = 100;

// Sprite images
const sprites = {
    BOTTLE: new Image(),
    HOPS: new Image(),
    LEMON: new Image(),
    HAND: new Image(),
    ARGENTINA: new Image(),
    FLY: new Image(),
    COIN: new Image()
};

// Object types with specific sizes
const OBJECTS = {
    BOTTLE: { 
        points: 10,
        type: 'good',
        width: 30,
        height: 50,
        sprite: sprites.BOTTLE,
        speed: GAME_SPEED
    },
    HOPS: { 
        points: 5,
        type: 'good',
        width: 35,
        height: 35,
        sprite: sprites.HOPS,
        speed: GAME_SPEED
    },
    LEMON: { 
        points: -10,
        type: 'bad',
        width: 45,
        height: 35,
        sprite: sprites.LEMON,
        speed: GAME_SPEED
    },
    HAND: { 
        points: -15,
        type: 'bad',
        width: 50,
        height: 50,
        sprite: sprites.HAND,
        speed: GAME_SPEED
    },
    ARGENTINA: {
        points: 15,
        type: 'good',
        width: 40,
        height: 40,
        sprite: sprites.ARGENTINA,
        speed: GAME_SPEED
    },
    FLY: {
        points: -8,
        type: 'bad',
        width: 30,
        height: 30,
        sprite: sprites.FLY,
        speed: GAME_SPEED
    },
    COIN: {
        points: 20,
        type: 'good',
        width: 25,
        height: 25,
        sprite: sprites.COIN,
        speed: GAME_SPEED * 1.5 // 50% más rápido que los demás objetos
    }
};

// Game variables
let canvas, ctx;
let player = {
    x: 0,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    lives: 3
};
let gameObjects = [];
let score = 0;
let gameLoop;
let spawnInterval;
let leftPressed = false;
let rightPressed = false;
let isGameRunning = false;

// Load all sprites
function loadSprites() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        let errorCount = 0;
        const totalSprites = Object.keys(sprites).length;

        function handleLoad() {
            loadedCount++;
            console.log(`Sprite cargado (${loadedCount}/${totalSprites})`);
            if (loadedCount + errorCount === totalSprites) {
                if (errorCount > 0) {
                    reject(new Error(`${errorCount} sprites no se pudieron cargar`));
                } else {
                    resolve();
                }
            }
        }

        function handleError(e) {
            errorCount++;
            console.error('Error cargando sprite:', e.target.src);
            if (loadedCount + errorCount === totalSprites) {
                reject(new Error(`${errorCount} sprites no se pudieron cargar`));
            }
        }

        // Asignar las rutas y los manejadores de eventos
        Object.entries(sprites).forEach(([key, sprite]) => {
            console.log(`Intentando cargar sprite: ${key}`);
            sprite.onload = handleLoad;
            sprite.onerror = handleError;
        });

        // Establecer las rutas después de configurar los manejadores
        sprites.BOTTLE.src = 'assets/sprites/bottle.png';
        sprites.HOPS.src = 'assets/sprites/hops.png';
        sprites.LEMON.src = 'assets/sprites/lemon.png';
        sprites.HAND.src = 'assets/sprites/hand.png';
        sprites.ARGENTINA.src = 'assets/sprites/argentina.png';
        sprites.FLY.src = 'assets/sprites/fly.png';
        sprites.COIN.src = 'assets/sprites/coin.png';
    });
}

// Initialize game
async function init() {
    console.log('Iniciando el juego...');
    try {
        // Get DOM elements
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('No se encontró el elemento canvas');
        }
        ctx = canvas.getContext('2d');
        
        // Event listeners
        const startButton = document.getElementById('startButton');
        if (!startButton) {
            throw new Error('No se encontró el botón de inicio');
        }
        
        startButton.addEventListener('click', () => {
            console.log('Botón Comenzar clickeado');
            startGame();
        });
        
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                console.log('Reiniciando juego...');
                showScreen('start-screen');
            });
        }
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Touch controls
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);

        console.log('Intentando cargar sprites...');
        await loadSprites();
        console.log('Sprites cargados exitosamente');

        // Show start screen
        showScreen('start-screen');
        console.log('Inicialización completada');
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        alert('Error al iniciar el juego: ' + error.message);
    }
}

function showScreen(screenId) {
    console.log('Cambiando a pantalla:', screenId);
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show requested screen
    const targetScreen = document.getElementById(screenId);
    console.log('Pantalla objetivo encontrada:', targetScreen);
    targetScreen.classList.remove('hidden');
    
    // Special handling for game screen
    if (screenId === 'game-screen') {
        resizeCanvas();
        resetGame();
    }
}

function resizeCanvas() {
    const gameArea = canvas.parentElement;
    canvas.width = gameArea.offsetWidth;
    canvas.height = gameArea.offsetHeight;
}

function resetGame() {
    score = 0;
    player.lives = 3;
    gameObjects = [];
    
    // Reset player position
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
    
    updateLives();
    updateScore();
}

function startGame() {
    console.log('Iniciando el juego...');
    console.log('Estado actual:', { isGameRunning });
    
    if (isGameRunning) {
        console.log('El juego ya está corriendo');
        return;
    }
    
    showScreen('game-screen');
    isGameRunning = true;
    console.log('Pantalla de juego mostrada');
    
    // Start game loops
    gameLoop = setInterval(update, 1000 / 60);
    spawnInterval = setInterval(spawnObject, SPAWN_RATE);
    console.log('Loops del juego iniciados');
}

function spawnObject() {
    if (!isGameRunning) return;
    
    const objectTypes = Object.keys(OBJECTS);
    let randomType;

    // La moneda tiene menos probabilidad de aparecer (10%)
    if (Math.random() < 0.1) {
        randomType = 'COIN';
    } else {
        // Excluir COIN del array de objetos para la selección normal
        const regularObjects = objectTypes.filter(type => type !== 'COIN');
        randomType = regularObjects[Math.floor(Math.random() * regularObjects.length)];
    }

    const objectConfig = OBJECTS[randomType];
    
    gameObjects.push({
        x: Math.random() * (canvas.width - objectConfig.width),
        y: -objectConfig.height,
        width: objectConfig.width,
        height: objectConfig.height,
        type: randomType,
        speed: objectConfig.speed,
        ...objectConfig
    });
}

function update() {
    // Update player position
    if (leftPressed && player.x > 0) {
        player.x -= player.speed;
    }
    if (rightPressed && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Update objects
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        obj.y += obj.speed; // Usar la velocidad específica del objeto

        // Check collision with player
        if (checkCollision(obj, player)) {
            gameObjects.splice(i, 1);
            handleCollision(obj);
            continue;
        }

        // Remove objects that fall off screen
        if (obj.y > canvas.height) {
            gameObjects.splice(i, 1);
            if (obj.type === 'good' && obj.points !== 20) { // No perder vida por monedas perdidas
                loseLife();
            }
        }
    }

    draw();
}

function draw() {
    // Clear canvas with a light background
    ctx.fillStyle = '#f0f8ff'; // Fondo azul muy claro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player (glass)
    drawGlass(player.x, player.y);

    // Draw game objects
    gameObjects.forEach(obj => {
        drawObject(obj);
    });
}

function drawGlass(x, y) {
    const width = player.width;
    const height = player.height;

    // Cuerpo del porrón (cerveza)
    ctx.fillStyle = '#FFD700'; // Color dorado para la cerveza
    ctx.beginPath();
    ctx.rect(x + 8, y + 15, width - 16, height - 20);
    ctx.fill();

    // Contorno del porrón
    ctx.strokeStyle = '#0056A2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Cuerpo principal
    ctx.moveTo(x + 5, y + height);
    ctx.lineTo(x + width - 5, y + height);
    ctx.lineTo(x + width - 5, y + 10);
    ctx.lineTo(x + 5, y + 10);
    ctx.lineTo(x + 5, y + height);
    
    // Asa del porrón
    ctx.moveTo(x + width - 5, y + height/3);
    ctx.quadraticCurveTo(
        x + width + 15, y + height/2,
        x + width - 5, y + height * 0.8
    );
    
    ctx.stroke();

    // Espuma
    ctx.fillStyle = 'white';
    const espumaY = y + 15;
    // Primera capa de espuma
    for(let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x + 15 + i * 12, espumaY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    // Segunda capa de espuma
    for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 21 + i * 12, espumaY - 6, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Brillos en el vidrio
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.rect(x + 12, y + 20, 4, height - 30);
    ctx.fill();
}

function drawObject(obj) {
    if (obj.sprite) {
        ctx.drawImage(obj.sprite, obj.x, obj.y, obj.width, obj.height);
    }
}

function checkCollision(obj, player) {
    return obj.x < player.x + player.width &&
           obj.x + obj.width > player.x &&
           obj.y < player.y + player.height &&
           obj.y + obj.height > player.y;
}

function handleCollision(obj) {
    score += obj.points;
    updateScore();
    
    if (obj.type === 'bad') {
        loseLife();
    }
    
    if (score >= WIN_SCORE) {
        endGame(true);
    }
}

function loseLife() {
    player.lives--;
    updateLives();
    
    if (player.lives <= 0) {
        endGame(false);
    }
}

function updateScore() {
    document.getElementById('scoreValue').textContent = score;
}

function updateLives() {
    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`life${i}`);
        heart.classList.toggle('lost', i > player.lives);
    }
}

function endGame(won) {
    isGameRunning = false;
    clearInterval(gameLoop);
    clearInterval(spawnInterval);
    
    const message = won 
        ? '¡Ganaste! 🍻 ¡Conseguiste los 100 puntos!' 
        : `¡Game Over! 💔 Te quedaste sin vidas con ${score} puntos`;
    
    document.getElementById('endMessage').textContent = message;
    document.getElementById('finalScore').textContent = score;
    showScreen('end-screen');
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
    if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
}

// Touch controls
let touchX = null;

function handleTouchStart(e) {
    const touch = e.touches[0];
    touchX = touch.clientX;
}

function handleTouchMove(e) {
    if (!touchX) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const diff = touch.clientX - touchX;
    
    player.x += diff * 0.5;
    
    // Keep player within bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    
    touchX = touch.clientX;
}

function handleTouchEnd() {
    touchX = null;
}

// Initialize game when page loads
window.addEventListener('load', init); 