console.log("script is workin");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 65;

const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const livesText = document.getElementById("lives");

const eventMessage = document.getElementById("event-message");

const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");

const restartButton = document.getElementById("restart-button");
const pauseOverlay = document.getElementById("pause-overlay");

const eventCircle = document.getElementById("event-circle");
const eventIcon = document.getElementById("event-icon");

// GAME VARIABLES

let score = 0;
let lives = 3;
let gameRunning = false;   
let startTime = Date.now();
let lastSpeedIncrease = Date.now();
let shakeAmount = 0;
let shakeFrames = 0;
let gamePaused = false;

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

let lifeHeart = {
    x: 0,
    y:0,
    radius: 14,
    speed:3,
    active: false
};

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
let blackoutActive = false;

//Random Event Timer

let nextEventTime = 0;
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

//UPDATE

function update() {

    updatePaddle();
    updateBall(mainBall);
    updateExtraBalls();
    updateLifeHeart(); 
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

    // BALL TRAIL
    
    if (trailEnabled) {
        if (!ball.trail) {
            ball.trail = [];
        }

        ball.trail.push({
            x:ball.x,
            y:ball.y,
            dx:ball.dx,
            dy:ball.dy
        });

        if (ball.trail.length >7) {
            ball.trail.shift();
        }
    } else if (ball.trail) {
        ball.trail = [];
    }

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
    hitPosition = Math.max(0, Math.min(1, hitPosition));
    
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

     triggerScreenShake();

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

    triggerScreenShake("strong");

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
    let angle = (Math.random() * 0.5) + 0.35;
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
    if(!gameRunning) {
        return;
    }

    if (eventActive) {
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
    blackoutActive=true;
    eventDuration = 7000;
    eventEndTime = Date.now() + eventDuration;
}

//Event5-Extra life

function extraLifeEvent() {
    showEvent("❤️");

    spawnLifeHeart();
    
    eventDuration = 10000;
    eventEndTime=Date.now() + eventDuration;
}

function spawnLifeHeart() {
    lifeHeart.x =
    Math.random() * (canvas.width - 60) + 30;
    lifeHeart.y = -30;
    lifeHeart.active = true;
}

function updateLifeHeart() {
    if (!lifeHeart.active) {
        return;
    }

    lifeHeart.y += lifeHeart.speed;

    if (
        lifeHeart.y + lifeHeart.radius >= paddle.y &&
        lifeHeart.y - lifeHeart.radius <= paddle.y +paddle.height &&
        lifeHeart.x + lifeHeart.radius >= paddle.x &&
        lifeHeart.x - lifeHeart.radius <= paddle.x + paddle.width
    ) {
        if (lives < 3) {
            lives++;
            updateLives();
        }

        lifeHeart.active = false;
    }

    if (lifeHeart.y - lifeHeart.radius > canvas.height) {
        lifeHeart.active = false;
    }
}

function drawLifeHeart() {
    if (!lifeHeart.active) {
        return;
    }

    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        "❤️",
        lifeHeart.x,
        lifeHeart.y
    );
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
    blackoutActive = false;
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
    eventMessage.style.opacity = "0";
}

//Draw Everything

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    if (shakeEnabled && shakeFrames > 0) {
        let offsetX = (Math.random() -0.5) * shakeAmount;
        let offsetY = (Math.random() -0.5) * shakeAmount;

        ctx.translate(offsetX, offsetY);
        shakeFrames--;
    }

    drawBall(mainBall);
    for (let ball of extraBalls) {
        drawBall(ball);
    }

    drawLifeHeart();

    drawPaddle();

    if(blackoutActive) {
        let elapsed = 
        eventDuration - (eventEndTime - Date.now());
        let fadeTime = 700;
        let opacity;

        if(elapsed < fadeTime) {
            opacity = elapsed /fadeTime;
        } else if (elapsed > eventDuration - fadeTime) {
            opacity = 
            (eventDuration - elapsed) / fadeTime;
        } else {
            opacity = 1;
        }

        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    ctx.restore();
}

function triggerScreenShake(strength = "normal") {
    if (!shakeEnabled || !gameRunning) return;

    if(strength === "strong"){
    shakeAmount = 12;
    shakeFrames = 16;
    } else {
        shakeAmount = 12;
        shakeFrames =8;
    }
}

//Draw Ball

function drawBall(ball) {
    if(!ball.active) {
        return;
    }

    // DRAW BALL TRAIL

    if (trailEnabled && ball.trail) {
        ctx.save();

        for(let i=0; i<ball.trail.length; i++) {
            let point = ball.trail[i];

            let length= Math.sqrt(
                point.dx*point.dx +
                point.dy*point.dy
            );

            if (length ===0) continue;

            let dirX = point.dx/length;
            let dirY = point.dy/length;
            let perpX = -dirY;
            let perpY = dirX;

            let trailLength = 20;
            let trailWidth = ball.radius * 1.3;

            let backX = point.x -dirX*trailLength;
            let backY = point.y - dirY*trailLength;

            ctx.globalAlpha = 0.08 +(i / ball.trail.length)*0.25;

            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(
                point.x + perpX * trailWidth/2,
                point.y + perpY *trailWidth /2
            );

            ctx.lineTo(
                point.x - perpX * trailWidth /2,
                point.y - perpY *trailWidth /2
            );

            ctx.lineTo(
                backX - perpX *trailWidth *0.12,
                backY - perpY *trailWidth *0.12
            );

            ctx.lineTo(
                backX + perpX * trailWidth *0.12,
                backY + perpY * trailWidth *0.12
            );

            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
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

const pauseRestartBtn = document.getElementById("restartBtn");

pauseRestartBtn.addEventListener("click", function () {
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

const homeScreen = document.getElementById("home-screen");
const playBtn = document.getElementById("playBtn");

playBtn.addEventListener("click", function (){
    homeScreen.style.display = "none";

    nextEventTime = Date.now() + randomEventDelay();

    gameRunning = true;
    gameLoop();
});

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("closeSettings");

settingsBtn.addEventListener("click", function () {
    settingsPanel.classList.toggle("open");
    howToPlayPanel.classList.remove("open");
});


document.getElementById("settings-panel").classList.add("open");

const soundToggle = document.getElementById("soundToggle");
let soundEnabled = true;

soundToggle.addEventListener("click", function () {
    soundEnabled =!soundEnabled;
    soundToggle.classList.toggle("off", !soundEnabled);
});

const musicToggle = document.getElementById("musicToggle");
let musicEnabled = true;

musicToggle.addEventListener("click", function () {
    musicEnabled = !musicEnabled;
    musicToggle.classList.toggle("off", !musicEnabled);
});

const trailToggle = document.getElementById("trailToggle");
let trailEnabled = true;

trailToggle.addEventListener("click", function () {
    trailEnabled = !trailEnabled;
    trailToggle.classList.toggle("off", !trailEnabled);
});

const howToPlayBtn = document.getElementById("howToPlayBtn");
const howToPlayPanel = document.getElementById("howtoplay-panel");
const closeHowToPlay = document.getElementById("closeHowToPlay");

howToPlayBtn.addEventListener("click", function () {
    howToPlayPanel.classList.toggle("open");
    settingsPanel.classList.remove("open");
});

const shakeToggle = document.getElementById("shakeToggle");
let shakeEnabled = true;

shakeToggle.addEventListener("click", function () {
    shakeEnabled = !shakeEnabled;
    shakeToggle.classList.toggle("off", !shakeEnabled);
});

const gameContainer = document.querySelector(".gamecontainer");

const pauseBtn = document.getElementById("pauseBtn");
const pauseScreen = document.getElementById("pause-screen");
const resumeBtn = document.getElementById("resumeBtn");

pauseBtn.addEventListener("click", function () {
    if (!gameRunning || gamePaused) return;
    gamePaused = true;
    gameRunning = false;
    pauseScreen.style.display = "block";
    pauseOverlay.style.display = "block";
});

resumeBtn.addEventListener("click", function () {
    if (!gamePaused) return;
    gamePaused = false;
    pauseScreen.style.display = "none";
    pauseOverlay.style.display = "none";
    gameRunning =true;
    gameLoop();
});