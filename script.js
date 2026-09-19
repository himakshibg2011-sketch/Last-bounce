const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const livesText = document.getElementById("lives");

const eventMessage = document.getElementById("event-Message");

const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");

const restartButton = document.getElementById("restart-button");

// CANVAS SIZE

canvas.width = 900;
canvas.height = 600;

// GAME VARIABLES

let score = 0;
let lives = 3;
let gameRunning = true;
let startTime = Date.now();
let lastSpeedIncrease = Date.now();

// PLAYER / PADDLE

const paddle = {

    width: 140,
    height: 18,
    x: canvas.width / 2 - 70,
    y: canvas.height - 45,
    speed:8,
    dx: 0
};

// BALL

const mainBall = {
    x:canvas.width / 2,
    y:canvas.height / 2,
    radius: 12,
    speed: 5,
    dx:5,
    dy:-4,
    active: true
};

// Extra balls created by events
let extraBalls = [];

// KEYBOARD

const keys ={
    left: false,
    right:false
};

document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keys.right = false;
    }
});

// EVENT SYSTEM
let eventActive = false;
let currentEvent = null;
let eventEndTime = 0;

//Random Event Timer

let nextEventTime = Date.now() + randomEventDelay();
function randomEventDelay() {
    return 15000 + Math.random() * 15000;
}

// GAME LOOP 

function gameLoop() {
    if (!gameRunning) {
        return;
    }

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

//UPDATE

function update() {

    updatePaddle();
    updateBall(mainBall);
    updateExtraBalls();
    updateTimer();
    increaseDifficulty();
    checkEvents();
}

// PADDLE MOVEMENT 

function updatePaddle() {

    if (keys.left) {
        paddle.x -= paddle.speed;
    }

    if (keys.right) {
        paddle.x += paddle.speed;
    }

    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (paddle.x +paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// BALL MOVEMENT

function updateBall(ball) {
    if (!ball.active) {
        return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x - ball.radius <=0) {
        ball.x = ball.radius;
        ball.dx *= -1;
    }

    if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx *= -1;
    }

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
    }

 //PADDLE COLLISION

 if (
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
 ) {
    ball.dy *= -1;

    let hitPosition=
    (ball.x - paddle.x) / paddle.width;
    let angle = (hitPosition - 0.5) *2;
    ball.dx = angle * ball.speed;

    ball.dy = -Math.abs(ball.dy);
    score +=10;
    scoreText.textContent = score;
 }

 // Ball falls

 if (ball.y - ball.radius > canvas.height) {
    if (ball === mainBall) {
        loseLife();
    }
    else {
        ball.active = false;
    }
 }
}

//Extra balls 
function updateExtraBalls() {
    for (let ball of extraBalls) {
        updateBall(ball);
    }

    extraBalls = extraBalls.filter(ball => ball.active);
}

//Lose life

function loseLife() {
    lives--;
    updateLives();

    if (lives <=0) {
        endGame();
        return;
    }
}

// Reset ball