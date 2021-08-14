"use strict";

const minBreathCount = 20;
const maxBreathCount = 40;
const fullBreathDurationInSeconds = 2.65;
const inhaleExhaleLengthRatio = 0.7;
const phaseThreeHoldSeconds = 15;

const roundLabel = document.getElementById("round");
const phaseLabel = document.getElementById("phase");
const instructionLabel = document.getElementById("instruction");
const breathCountLabel = document.getElementById("counter");
const clockLabel = document.getElementById("clock");

let currentBreathCount = 1;
let currentRound = 1;
let currentPhase = 0;

let startTime, deltaTimeInSeconds;

const totalSounds = 13;
let fullBreathSound, inhaleSound, exhaleSound, xMinutesPassedSounds;
let loadedSounds = 0;

const breathCounterAnimation = new Animation(new KeyframeEffect(breathCountLabel, [
    {opacity: 0.0, transform: "scale(0.0)", filter: "blur(2vh)"},
    {opacity: 1.0, transform: "scale(1.0)", filter: "blur(0)", offset: inhaleExhaleLengthRatio},
    {opacity: 0.0, transform: "scale(0.0)"}
], {duration: fullBreathDurationInSeconds * 1000, fill: "backwards"}));

const clockAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.8, transform: "translateY(0)"},
    {opacity: 1.0, transform: "translateY(-0.5vh)", offset: 0.5},
    {opacity: 0.8, transform: "translateY(0)"}
], {duration: 1000, fill: "backwards"}));

const clockShowAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.0, transform: "scale(0.0)", filter: "blur(2vh)"},
    {opacity: 0.8, transform: "scale(1.0)", filter: "blur(0)"}
],  {duration: fullBreathDurationInSeconds * inhaleExhaleLengthRatio * 1000, fill: "backwards"}));

const clockHideAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.8, transform: "scale(1.0)"},
    {opacity: 0.0, transform: "scale(0.0)"}
],  {duration: fullBreathDurationInSeconds * (1.0 - inhaleExhaleLengthRatio) * 1000, fill: "backwards"}));

breathCounterAnimation.onfinish = function () {
    currentBreathCount++;
    if (currentBreathCount <= maxBreathCount) {
        breathCountLabel.textContent = "" + currentBreathCount;
        playFullBreathSound();
        breathCounterAnimation.play();
    } else {
        startPhaseTwo();
    }
};

clockAnimation.onfinish = function () {
    deltaTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(deltaTimeInSeconds / 60);
    const seconds = deltaTimeInSeconds % 60;
    if (currentPhase === 2) {
        if (minutes >= 1 && minutes <= 10 && seconds === 0) {
            playMinutesPassedSound(minutes);
        }
        clockLabel.textContent = renderClockText(minutes, seconds);
        clockAnimation.play();
    } else if (currentPhase === 3) {
        if (deltaTimeInSeconds <= phaseThreeHoldSeconds) {
            clockLabel.textContent = renderClockText(minutes, seconds);
            clockAnimation.play();
        } else {
            playExhaleSound();
            clockHideAnimation.play();
        }
    }
};

clockShowAnimation.onfinish = function () {
    startTime = Date.now();
    clockAnimation.currentTime = 0;
    clockAnimation.play();
};

clockHideAnimation.onfinish = nextRound;

function startPhaseOne() {
    currentPhase = 1;
    playFullBreathSound();
    roundLabel.textContent = "round " + currentRound;
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = `Breathe deeply ${minBreathCount}-${maxBreathCount} times and exhale after the last breath.`;
    breathCountLabel.style.display = "inline-block";
    breathCountLabel.textContent = "1";
    breathCounterAnimation.play();
}

function startPhaseTwo() {
    currentPhase = 2;
    stopFullBreathSound();
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = "Hold your breath as long as it's comfortable for you and tap.";

    currentBreathCount = 1;
    breathCountLabel.style.display = "none";
    breathCounterAnimation.pause();
    breathCounterAnimation.currentTime = 0;

    clockLabel.textContent = "00:00";
    clockLabel.style.display = "inline-block";

    startTime = Date.now();
    clockAnimation.currentTime = 0;
    clockAnimation.play();
}

function startPhaseThree()  {
    currentPhase = 3;
    playInhaleSound();
    phaseLabel.textContent = "phase " + currentPhase;
    instructionLabel.textContent = `Inhale deeply, hold your breath for ${phaseThreeHoldSeconds} seconds and exhale.`;

    clockAnimation.pause();
    clockAnimation.currentTime = 0;

    clockLabel.classList.add("hold-empty");
    clockLabel.textContent = "00:00";

    clockShowAnimation.play();
}

function nextRound() {
    currentRound++;

    clockLabel.style.display = "none";
    clockLabel.classList.remove("hold-empty");

    startPhaseOne();
}

function loadSoundsAndStart() {
    fullBreathSound = loadSound("sounds/full-breath.mp3");
    inhaleSound = loadSound("sounds/inhale.mp3");
    exhaleSound = loadSound("sounds/exhale.mp3");

    xMinutesPassedSounds = [];
    for (let i = 1; i <= 10; i++) {
        xMinutesPassedSounds.push(loadSound(`sounds/${i}min.mp3`));
    }
}

function loadSound(file) {
    const audio = new Audio(file);
    audio.load();
    audio.addEventListener("canplaythrough", function () {
        loadedSounds++;
        if (loadedSounds === totalSounds) {
            ready();
        }
    });
    return audio;
}

function ready() {
    phaseLabel.textContent = "tap to start";
    document.body.addEventListener("click", onClick, true);
}

function onClick(e) {
    switch (currentPhase) {
        case 0:
            startPhaseOne();
            break;
        case 1:
            startPhaseTwo();
            break;
        case 2:
            startPhaseThree();
            break;
    }
    onTouchEnd(e);
}

function playFullBreathSound() {
    fullBreathSound.currentTime = 0;
    fullBreathSound.play();
}

function stopFullBreathSound() {
    fullBreathSound.pause();
    fullBreathSound.currentTime = 0;
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
    const minutesSound = xMinutesPassedSounds[minutes - 1];
    minutesSound.currentTime = 0;
    minutesSound.play();
}

function renderClockText(minutes, seconds) {
    return padInteger(minutes, 2) + ":" + padInteger(seconds, 2);
}

function padInteger(number, size) {
    let paddedNumber = "" + number;
    while (paddedNumber.length < size) {
        paddedNumber = "0" + paddedNumber;
    }
    return paddedNumber;
}

/************************* pull to refresh *************************/

const pullStart = {x: 0, y: 0};
const pullEnd = {x: 0, y: 0};

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

document.addEventListener("DOMContentLoaded", loadSoundsAndStart);