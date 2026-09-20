console.log("script is workin");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const livesText = document.getElementById("lives");

const eventMessage = document.getElementById("event-message");

const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");

const restartButton = document.getElementById("restart-button");

const eventCircle = document.getElementById("event-circle");
const eventIcon = document.getElementById("event-icon");

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
let eventDuration = 0;

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
    updateEventCircle();
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
        ball.dx = Math.abs(ball.dx);
    }

    if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -Math.abs(ball.dx);
    }

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = Math.abs(ball.dy);
    }

 //PADDLE COLLISION

 if (
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width
 ) {

    ball.y = paddle.y - ball.radius;

    let hitPosition=
    (ball.x - paddle.x) / paddle.width;
    
    let currentSpeed = 
     Math.sqrt(
        ball.dx * ball.dx +
        ball.dy * ball.dy
     );

     let angle = (hitPosition - 0.5) *2;

     ball.dx = angle * currentSpeed * 0.8;

     ball.dy = -Math.sqrt(
        currentSpeed * currentSpeed - 
        ball.dx* ball.dx
     );

     score += 10;

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

    mainBall.x = canvas.width / 2;
    mainBall.y = canvas.height / 2 - 80;

    let currentSpeed = 
    Math.sqrt(
        mainBall.dx * mainBall.dx +
        mainBall.dy * mainBall.dy
    );

    let direction = Math.random() < 0.5 ? -1:1;
    let angle = (Math.random() * 0.8) + 0.35;
    mainBall.dx = direction * currentSpeed * angle;
    mainBall.dy = -Math.sqrt(
        currentSpeed * currentSpeed -
        mainBall.dx * mainBall.dx
    );
}

// Update lives

function updateLives() {
    livesText.textContent = "❤️".repeat(lives);
}

//Timer

function updateTimer() {
    let seconds = Math.floor(
        (Date.now() - startTime) / 1000
    );
    timeText.textContent = seconds;
}

// Difficutly 

function increaseDifficulty() {
    if (Date.now()- lastSpeedIncrease >= 15000) {
     
        mainBall.dx *= 1.10;
        mainBall.dy *= 1.10;

        lastSpeedIncrease = Date.now();
    }
}

// Event checking

function checkEvents() {
    if(eventActive) {
        if (Date.now() >= eventEndTime) {
            endEvent();
        }

        return;
    }

    if (Date.now() >= nextEventTime) {
        startRandomEvent();
    }
}

// Start random event

function startRandomEvent() {
    eventActive = true;

    const events =[
        speedEvent,
        cloneEvent,
        shrinkEvent,
        blackoutEvent,
        extraLifeEvent
    ];

    const randomIndex = 
    Math.floor(Math.random() * events.length);

    currentEvent = events[randomIndex];
    currentEvent();
}

//Event1-Speed

function speedEvent() {
    showEvent("⚡");
    mainBall.dx*= 1.6;
    mainBall.dy *= 1.6;

    eventDuration= 7000;
    eventEndTime = Date.now() + 7000;
}

// Event2-Clone

function cloneEvent() {
    showEvent("👯");

    let clone = {
        x:mainBall.x,
        y:mainBall.y,
        radius:mainBall.radius,
        speed:mainBall.speed,
        dx:-mainBall.dx,
        dy:mainBall.dy,
        active:true
    };

    extraBalls.push(clone);
    eventDuration = 12000;
    eventEndTime = Date.now() + 12000;
}

//Event3-Small paddle

function shrinkEvent() {
    showEvent("🧊");
    paddle.width = 80;
    eventDuration = 1000;
    eventEndTime = Date.now() + 10000;
}

//Event4-Blackout

function blackoutEvent() {
    showEvent("🌑");
    document.body.style.background = "black";
    eventDuration = 7000;
    eventEndTime = Date.now() + 7000;
}

//Event5-Extra life

function extraLifeEvent() {
    showEvent("❤️");

    if(lives,3) {
        lives++;
        updateLives();
    }
    
    eventDuration = 3000;
    eventEndTime=Date.now() + 3000;
}

//End Event

function endEvent() {
    if (currentEvent === speedEvent) {
        mainBall.dx /= 1.6;
        mainBall.dy /= 1.6;
    }

    eventActive = false;
    currentEvent = null;

    paddle.width = 140;
    document.body.style.background = "#111";
    hideEvent();
    eventMessage.style.opacity ="0";
    nextEventTime = Date.now() + randomEventDelay();
}

//Event Message

function showEvent(message) {

    eventMessage.style.opacity ="1";
    eventCircle.style.display = "flex";
    eventIcon.textContent = message;
}

function hideEvent() {

    eventTitle.textContent = "";
    eventTimer.textContent = "";
    eventMessage.style.opacity = "0";
}

//Draw Everything

function draw() {
    ctx.fillStyle = "#191919";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBall(mainBall);

    for (let ball of extraBalls) {
        drawBall(ball);
    }

    drawPaddle();
}

//Draw Ball

function drawBall(ball) {
    if(!ball.active) {
        return;
    }

    ctx.beginPath();
    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI *2
    );

    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

//Draw paddle

function drawPaddle() {
    ctx.fillStyle = "white";
    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

//Gameover

function endGame() {
    gameRunning = false;
    finalScore.textContent = score;
    finalTime.textContent = timeText.textContent;
    
    gameOverScreen.style.display = "block";
}

//Restart

restartButton.addEventListener("click", function() {
    location.reload();
});

function updateEventCircle() {

    if(!eventActive) {
        return;
    }

    let remaining = eventEndTime - Date.now();
    let percentage = remaining / eventDuration;
    if (percentage <0) {
        percentage = 0;
    }

    let degrees = percentage * 360;

    eventCircle.style.background =
    `conic-gradient(
    white ${degrees}deg,
    transparent ${degrees}deg
)`;
}