
const minBreathCount = 20;
const maxBreathCount = 40;
const inhaleExhaleLengthRatio = 0.7;
const lastPhaseFullHoldSeconds = 15;
const breatheDurationInSeconds = 2.65;

const roundLabel = document.getElementById("round");
const phaseLabel = document.getElementById("phase");
const instructionLabel = document.getElementById("instruction");
const breathCounter = document.getElementById("counter");
const clockLabel = document.getElementById("clock");

let currentBreathCount = 1;
let currentRound = 1;
let currentPhase = 0;

let startTime, deltaTimeInSeconds;

const totalSounds = 13;
let fullBreathSound, inhaleSound, exhaleSound, xMinutesPassedSounds;
let loadedSounds = 0;

const breathCounterAnimation = breathCounter.animate([
    {opacity: 0.0, transform: "scale(0.0)", filter: "blur(2vh)"},
    {opacity: 1.0, transform: "scale(1.0)", filter: "blur(0)", offset: inhaleExhaleLengthRatio},
    {opacity: 0.0, transform: "scale(0.0)"}
], {duration: breatheDurationInSeconds * 1000, fill: "forwards"});
breathCounterAnimation.pause()

const clockAnimation = clockLabel.animate([
    {opacity: 0.8, transform: "translateY(0) scale(1.00)"},
    {opacity: 1.0, transform: "translateY(-0.5rem) scale(1.00)", offset: 0.50},
    {opacity: 0.8, transform: "translateY(0) scale(1.00)"}
], {duration: 1000, fill: "forwards"});
clockAnimation.pause()

breathCounterAnimation.onfinish = function () {
    currentBreathCount++;
    if (currentBreathCount <= maxBreathCount) {
        breathCounter.textContent = "" + currentBreathCount;
        breathCounterAnimation.play();
        playFullBreathSound();
    } else {
        startPhaseTwo();
    }
}

clockAnimation.onfinish = function () {
    deltaTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(deltaTimeInSeconds / 60);
    const seconds = deltaTimeInSeconds % 60;
    if (currentPhase === 2) {
        clockLabel.textContent = padInteger(minutes, 2) + ":" + padInteger(seconds, 2);
        clockAnimation.play();
        if (seconds === 0) {
            if (minutes <= 10) {
                playMinutesPassedSound(minutes);
            }
        }
    } else if (currentPhase === 3) {
        if (deltaTimeInSeconds <= lastPhaseFullHoldSeconds) {
            clockLabel.textContent = padInteger(minutes, 2) + ":" + padInteger(seconds, 2);
            clockAnimation.play();
        } else if (deltaTimeInSeconds === lastPhaseFullHoldSeconds + 1) {
            playExhaleSound();
            clockLabel.style.display = "none";
            clockAnimation.play();
        } else {
            nextRound();
        }
    }
}

function startPhaseOne() {
    playFullBreathSound();
    roundLabel.textContent = "round " + currentRound;
    currentPhase = 1;
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = `Breathe deeply ${minBreathCount}-${maxBreathCount} times and exhale after the last breath.`;
    breathCounter.style.display = "inline-block";
    breathCounter.textContent = "1";
    breathCounterAnimation.play();
}

function startPhaseTwo() {
    currentPhase++;
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = "Hold your breath as long as it's comfortable for you and tap.";

    currentBreathCount = 1;
    breathCounter.style.display = "none";
    breathCounterAnimation.pause();
    breathCounterAnimation.currentTime = 0;

    startTime = Date.now();
    clockLabel.textContent = "00:00";
    clockLabel.style.display = "inline-block";
    clockAnimation.play();
}

function startPhaseThree()  {
    playInhaleSound();
    currentPhase++;
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = `Inhale deeply, hold your breath for ${lastPhaseFullHoldSeconds} seconds and exhale.`;

    clockLabel.classList.add("hold-empty");
    clockLabel.textContent = "00:00";
    clockAnimation.currentTime = 0;
    startTime = Date.now()
}

function nextRound() {
    clockLabel.style.display = "none";
    clockLabel.classList.remove("hold-empty");
    clockAnimation.pause();
    clockAnimation.currentTime = 0;

    currentRound++;
    startPhaseOne();
}

function loadSounds() {
    fullBreathSound = loadSound("sounds/full-breath.mp3");
    inhaleSound = loadSound("sounds/inhale.mp3");
    exhaleSound = loadSound("sounds/exhale.mp3");

    xMinutesPassedSounds = [];
    for (let i = 1; i <= 10; i++) {
        xMinutesPassedSounds.push(loadSound(`sounds/${i}min.mp3`));
    }
}

function loadSound(file) {
    let audio = new Audio(file);
    audio.load();
    audio.addEventListener("canplaythrough", onSoundLoaded);
    return audio;
}


function onSoundLoaded() {
    loadedSounds++;
    if (loadedSounds === totalSounds) {
        phaseLabel.textContent = "tap to start";
        document.body.addEventListener("click", onClick, true);
    }
}


function playFullBreathSound() {
    fullBreathSound.currentTime = 0;
    fullBreathSound.play();
}

function playInhaleSound() {
    inhaleSound.currentTime = 0;
    inhaleSound.play();
}

function playExhaleSound() {
    exhaleSound.currentTime = 0;
    exhaleSound.play();
}

function playMinutesPassedSound(minutes) {
    let sound = xMinutesPassedSounds[minutes - 1];
    sound.currentTime = 0;
    sound.play();
}

function padInteger(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

const pullStart = {x: 0, y: 0};

const pullEnd = {x: 0, y: 0};

function onClick(e) {
    if (currentPhase === 0) {
        startPhaseOne();
    } else if (currentPhase === 1) {
        startPhaseTwo();
    } else if (currentPhase === 2) {
        startPhaseThree();
    }
    onTouchEnd(e);
}

function onTouchStart(e) {
    if (typeof e["targetTouches"] !== "undefined") {
        pullStart.x = e.targetTouches[0].screenX;
        pullStart.y = e.targetTouches[0].screenY;
    } else {
        pullStart.x = e.screenX;
        pullStart.y = e.screenY;
    }
}

function onTouchEnd(e) {
    if (typeof e["changedTouches"] !== "undefined") {
        pullEnd.x = e.changedTouches[0].screenX;
        pullEnd.y = e.changedTouches[0].screenY;
    } else {
        pullEnd.x = e.screenX;
        pullEnd.y = e.screenY;
    }

    const dY = pullStart.y - pullEnd.y;
    const dX = pullStart.x - pullEnd.x;
    let isPullDown = dY < 0
        && ((Math.abs(dX) <= 100 && Math.abs(dY) >= 300)
            || (Math.abs(dX) / Math.abs(dY) <= 0.3 && dY >= 60));
    if (isPullDown) {
        location.reload();
    }
}

document.addEventListener("touchstart", onTouchStart, true);
document.addEventListener("touchend", onTouchEnd, true);

loadSounds();