"use strict";

const minBreathCount = 20;
const maxBreathCount = 40;
const fullBreathDurationInSeconds = 2.65;
const inhaleExhaleLengthRatio = 0.7;
const phaseThreeHoldSeconds = 15;

const body = document.body;
const roundLabel = document.getElementById("round");
const phaseLabel = document.getElementById("phase");
const instructionLabel = document.getElementById("instruction");
const breathCountLabel = document.getElementById("counter");
const clockLabel = document.getElementById("clock");
const hintLabel = document.getElementById("hint");
const finishButton = document.getElementById("finish-button");

const suggestions = [
    "Ok, that's it, turn off your screen and do some­thing else.",
    "Like taking a cold shower.",
    "Or doing some push ups.",
    "Or read a book.",
    "Or play an instrument.",
    "Or meditate.",
    "Or take a walk.",
    "Or water your plants."
];

let currentBreathCount = 1;
let currentRound = 1;
let currentPhase = -1;

let startTime, deltaTimeInSeconds;

const totalSounds = 17;
let loadedSounds = 0;
let clickSound, bellOneSound, bellTwoSound,
    fullBreathSound, lastFullBreathSound, inhaleSound, exhaleSound,
    xMinutesPassedSounds;

let suggestionIndex = 0;

/* animation used in first phase */
const breathAnimation = new Animation(new KeyframeEffect(breathCountLabel, [
    {opacity: 0.0, transform: "scale(0.0)", filter: "blur(2vh)"},
    {opacity: 1.0, transform: "scale(1.0)", filter: "blur(0)", offset: inhaleExhaleLengthRatio},
    {opacity: 0.0, transform: "scale(0.0)"}
], {duration: fullBreathDurationInSeconds * 1000, fill: "backwards"}));

/* animation used in first phase */
const breathBackgroundAnimation = new Animation(new KeyframeEffect(body, [
    {backgroundSize: "100vh"},
    {backgroundSize: "700vh", offset: inhaleExhaleLengthRatio * 0.75},
    {backgroundSize: "750vh", offset: inhaleExhaleLengthRatio},
    {backgroundSize: "350vh", offset: inhaleExhaleLengthRatio * 1.2},
    {backgroundSize: "100vh"}
], {duration: fullBreathDurationInSeconds * 1000, fill: "backwards"}));

/* animation used in second and third phase */
const clockAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.8, transform: "translateY(0)"},
    {opacity: 1.0, transform: "translateY(-0.5vh)", offset: 0.5},
    {opacity: 0.8, transform: "translateY(0)"}
], {duration: 1000, fill: "backwards"}));

/* animation used in third phase */
const clockShowAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.0, transform: "scale(0.0)", filter: "blur(2vh)"},
    {opacity: 0.8, transform: "scale(1.0)", filter: "blur(0)"}
],  {duration: fullBreathDurationInSeconds * inhaleExhaleLengthRatio * 1000, fill: "backwards"}));

/* animation used in third phase */
const clockHideAnimation = new Animation(new KeyframeEffect(clockLabel, [
    {opacity: 0.8, transform: "scale(1.0)"},
    {opacity: 0.0, transform: "scale(0.0)"}
],  {duration: fullBreathDurationInSeconds * (1.0 - inhaleExhaleLengthRatio) * 1000, fill: "backwards"}));

/* animation used in third phase */
const holdBackgroundAnimation = new Animation(new KeyframeEffect(body, [
    {backgroundSize: "100vh"},
    {backgroundSize: "750vh", offset: 1.0 / (phaseThreeHoldSeconds + fullBreathDurationInSeconds + 1.0)},
    {backgroundSize: "750vh", offset: 1.0 - (1.0 / (phaseThreeHoldSeconds + fullBreathDurationInSeconds + 1.0))},
    {backgroundSize: "100vh"}
], {duration: (phaseThreeHoldSeconds + fullBreathDurationInSeconds + 1) * 1000, fill: "backwards"}));

/* animation used in the ending */
const endingAnimation = new Animation(new KeyframeEffect(instructionLabel, [
    {opacity: 0.8, transform: "translateY(0)"},
    {opacity: 1.0, transform: "translateY(-0.5vh)", offset: 0.5},
    {opacity: 0.8, transform: "translateY(0)"}
], {duration: 4000, fill: "backwards"}));

breathAnimation.onfinish = function () {
    currentBreathCount++;
    if (currentBreathCount <= maxBreathCount) {
        if (currentBreathCount >= minBreathCount) {
            hintLabel.textContent = "Tap to go into retention sooner";
        }
        breathCountLabel.textContent = "" + currentBreathCount;
        playFullBreathSound();
        breathAnimation.play();
        breathBackgroundAnimation.play();
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

clockShowAnimation.onfinish = startClock;

clockHideAnimation.onfinish = nextRound;

endingAnimation.onfinish = function () {
  instructionLabel.textContent = suggestions[++suggestionIndex % suggestions.length];
  endingAnimation.play();
};

function reset(animation) {
    if (animation.playState === "running") {
        animation.cancel();
    }
}

function onClickFinish() {
    currentRound = 1;
    currentPhase = -1;

    reset(breathAnimation);
    reset(breathBackgroundAnimation);
    reset(clockHideAnimation);
    reset(clockAnimation);
    reset(holdBackgroundAnimation);

    stopFullBreathSound();

    finishButton.style.display = "none";
    breathCountLabel.style.display = "none";
    clockLabel.style.display = "none";
    clockLabel.classList.remove("hold-empty");

    roundLabel.textContent = "well done!";
    phaseLabel.textContent = "";
    instructionLabel.textContent = suggestions[0];
    hintLabel.textContent = "Tap to restart";
    endingAnimation.play();
}

function ready() {
    instructionLabel.textContent = "Let's do a simple breathing exercise."
    hintLabel.textContent = "Tap to continue";
    document.body.addEventListener("click", onClick, true);
    finishButton.addEventListener("click", onClickFinish, false);
}

function startIntroduction() {
    reset(endingAnimation);

    currentPhase = 0;
    roundLabel.textContent = "get ready";
    phaseLabel.textContent = "preparation";
    instructionLabel.textContent = "Sit or lie down in a safe place away from traffic or water."
    hintLabel.textContent = "Tap to start";
}

function startPhaseOne() {
    currentPhase = 1;
    playFullBreathSound();
    roundLabel.textContent = "Round " + currentRound;
    phaseLabel.textContent = "Phase I / III";
    instructionLabel.textContent = `Breathe deeply ${minBreathCount}-${maxBreathCount} times and exhale after the last breath.`;
    hintLabel.textContent = "";
    finishButton.style.display = "flex";
    breathCountLabel.style.display = "inline-block";
    breathCountLabel.textContent = "1";
    breathAnimation.play();
    breathBackgroundAnimation.play();
}

function startPhaseTwo() {
    currentPhase = 2;
    stopFullBreathSound();
    phaseLabel.textContent = "Phase II / III";
    instructionLabel.textContent = "Hold your breath as long as it's comfortable for you.";
    hintLabel.textContent = "Tap to continue";

    currentBreathCount = 1;
    breathCountLabel.style.display = "none";
    reset(breathAnimation);
    reset(breathBackgroundAnimation);

    clockLabel.textContent = "00:00";
    clockLabel.style.display = "inline-block";

    startClock();
}

function startPhaseThree()  {
    currentPhase = 3;
    playInhaleSound();
    phaseLabel.textContent = "Phase III / III";
    instructionLabel.textContent = `Inhale deeply, hold your breath for ${phaseThreeHoldSeconds} seconds, and then exhale.`;
    hintLabel.textContent = "";
    reset(clockAnimation);

    clockLabel.classList.add("hold-empty");
    clockLabel.textContent = "00:00";

    clockShowAnimation.play();
    holdBackgroundAnimation.play();
}

function nextRound() {
    currentRound++;

    clockLabel.style.display = "none";
    clockLabel.classList.remove("hold-empty");

    startPhaseOne();
}

function startClock() {
    startTime = Date.now();
    clockAnimation.currentTime = 0;
    clockAnimation.play();
}

function detectAndroid() {
    if (navigator.userAgent.toLowerCase().indexOf("android") !== -1) {
        document.body.classList.add("android");
    }
}

function loadSoundsAndStart() {
    detectAndroid();

    clickSound = loadSound("sounds/click.mp3");
    bellOneSound = loadSound("sounds/bell-1.mp3");
    bellTwoSound = loadSound("sounds/bell-2.mp3");
    fullBreathSound = loadSound("sounds/full-breath.mp3");
    lastFullBreathSound = loadSound("sounds/last-full-breath.mp3");
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

function onClick(e) {
    if (!e.target.matches('a, a *')) {
        startPhase(currentPhase + 1);
    }
    onTouchEnd(e);
}

function startPhase(phase) {
    switch (phase) {
        case 0:
            startIntroduction();
            break;
        case 1:
            startPhaseOne();
            break;
        case 2:
            startPhaseTwo();
            break;
        case 3:
            startPhaseThree();
            break;
    }
}

function playFullBreathSound() {
    if (currentBreathCount > maxBreathCount - 3 && currentBreathCount < maxBreathCount) {
        bellOneSound.currentTime = 0;
        bellOneSound.play();
    } else if (currentBreathCount === minBreathCount) {
        clickSound.currentTime = 0;
        clickSound.play();
    }

    if (currentBreathCount === maxBreathCount) {
        bellTwoSound.currentTime = 0;
        bellTwoSound.play();
        lastFullBreathSound.currentTime = 0;
        lastFullBreathSound.play();
    } else {
        fullBreathSound.currentTime = 0;
        fullBreathSound.play();
    }
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
