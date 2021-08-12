
const maxBreathCount = 40;
const inhaleExhaleLengthRatio = 0.7;
const fullHoldSeconds = 15;
const breatheDurationInSeconds = 2.0;

const roundLabel = document.getElementById("round");
const phaseLabel = document.getElementById("phase");
const instructionLabel = document.getElementById("instruction");
const breathCounter = document.getElementById("counter");
const clockLabel = document.getElementById("clock");

let currentBreathCount = 1;
let round = 1;
let phase = 0;

let startTime, deltaTimeInSeconds;

let click, minuteSounds;

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
        click.play();
    } else {
        startPhaseTwo();
    }
}

clockAnimation.onfinish = function () {
    deltaTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(deltaTimeInSeconds / 60);
    const seconds = deltaTimeInSeconds % 60;
    clockLabel.textContent = pad(minutes, 2) + ":" + pad(seconds, 2);
    if (phase === 2) {
        clockAnimation.play();
        if (seconds === 0) {
            if (minutes <= 10) {
                minuteSounds[minutes - 1].play();
            }
        }
    } else if (phase === 3) {
        if (deltaTimeInSeconds <= fullHoldSeconds) {
            clockAnimation.play();
        } else {
            nextRound();
        }
    }
}

function startPhaseOne() {
    roundLabel.textContent = "round " + round;
    phase = 1;
    phaseLabel.textContent = "phase " + phase;
    instructionLabel.textContent = "Breathe deeply 20-40 times and exhale after the last breath.";
    breathCounter.style.display = "inline-block";
    breathCounter.textContent = "1";
    breathCounterAnimation.play();
    click.play();
}

function startPhaseTwo() {
    phase++;
    phaseLabel.textContent = "phase " + phase;
    instructionLabel.textContent = "Hold your breath as long as it's comfortable and tap on inhale.";

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
    phase++;
    phaseLabel.textContent = "phase " + phase;
    instructionLabel.textContent = "Inhale deeply and hold your breath for " + fullHoldSeconds + " seconds.";

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

    round++;
    startPhaseOne();
}

function loadSounds() {
    click = new Audio("sounds/click.mp3");
    minuteSounds = [
        new Audio("sounds/1min.mp3"),
        new Audio("sounds/2min.mp3"),
        new Audio("sounds/3min.mp3"),
        new Audio("sounds/4min.mp3"),
        new Audio("sounds/5min.mp3"),
        new Audio("sounds/6min.mp3"),
        new Audio("sounds/7min.mp3"),
        new Audio("sounds/8min.mp3"),
        new Audio("sounds/9min.mp3"),
        new Audio("sounds/10min.mp3")];
}

function skipForwardToPhaseTwo() {
    if (phase === 0) {
        loadSounds();
        startPhaseOne();
    } else if (phase === 1) {
        startPhaseTwo();
    } else if (phase === 2) {
        startPhaseThree();
    }
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

document.body.addEventListener("click", skipForwardToPhaseTwo, true);

