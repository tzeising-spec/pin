const button = document.querySelector('.pin-button');
const pin = document.querySelector('.pin');
const splitPins = document.querySelectorAll('.split-pin');
const angryBirds = document.querySelectorAll('.angry-bird');
const flyingBanana = document.querySelector('.flying-banana');
const flyingHamster = document.querySelector('.flying-hamster');
const flyingWater = document.querySelector('.flying-water');
const flyingSandwich = document.querySelector('.flying-sandwich');
const flyingFish = document.querySelectorAll('.flying-fish');
const slingshot = document.querySelector('.slingshot');
const voice = document.querySelector('.voice');
const danceVoice = new Audio('sounds/discohallmusic.m4a');
danceVoice.preload = 'auto';
const collectionSlots = document.querySelectorAll('.collection-slot');
const bubbleBreak = new Audio('sounds/bubble_break.wav');
bubbleBreak.preload = 'auto';
const splitVoices = {
  fluff: new Audio('sounds/fluffmuffin!.mp3'),
  hamster: new Audio('sounds/hamster.mp3')
};
Object.values(splitVoices).forEach((audio) => { audio.preload = 'auto'; });

const idleFrame = 'images/1.png';
const talkingFrames = ['images/1.png', 'images/5.png'];
const allFrames = [idleFrame, ...talkingFrames];
const soundFiles = [
  'sounds/cantgetme.mp3',
  'sounds/sound2.mp3',
  'sounds/sound3.mp3',
  'sounds/slingshot.mp3',
  'sounds/banana.mp3',
  'sounds/fluffmuffin.mp3',
  'sounds/bay.mp3',
  'sounds/tunes.mp3',
  'sounds/goldfish.mp3',
  'sounds/both.mp3',
  'sounds/faceplant.mp3',
  'sounds/discohall.mp3'
];

allFrames.forEach((frame) => {
  const image = new Image();
  image.src = typeof frame === 'string' ? frame : frame.src;
});

let animationTimer = null;
let finishTimers = [];
let talkingDelay = null;
let isRoutineActive = false;
let mouthOpen = false;
let lastMouthChange = 0;
let isFinishing = false;
let currentSound = null;
let soundQueue = [];
let ignorePinUntil = 0;
let splitEffectTimers = [];
let activeSplitVoice = null;
let splitMouthTimer = null;
let danceFadeTimer = null;
let collectedThings = new Set();
let hasWon = false;

function collectThing(id) {
  const collectibleId = id.startsWith('fish-')
    ? [...collectionSlots].find((slot) => slot.dataset.collectible.startsWith('fish-')
      && !slot.classList.contains('is-collected'))?.dataset.collectible
    : id;
  if (!collectibleId || collectedThings.has(collectibleId)) return;
  collectedThings.add(collectibleId);
  document.querySelector(`.collection-slot[data-collectible="${collectibleId}"]`)?.classList.add('is-collected');
  if (collectedThings.size === collectionSlots.length) {
    document.querySelector('.collection-strip')?.classList.add('is-complete');
    hasWon = true;
    celebrateWin();
  }
}

function celebrateWin() {
  document.body.classList.add('is-celebrating');
  const confetti = document.createElement('span');
  confetti.className = 'celebration-confetti';
  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--angle', `${index * (360 / 28)}deg`);
    piece.style.setProperty('--distance', `${90 + Math.random() * 120}px`);
    piece.style.setProperty('--color', ['#e80035', '#ffbd25', '#55a63b', '#6a5acd'][index % 4]);
    confetti.appendChild(piece);
  }
  document.body.appendChild(confetti);
  window.setTimeout(() => confetti.remove(), 1500);

  const victoryAnimation = pin.animate(
    [
      { transform: 'translateY(0) rotate(0deg)', offset: 0 },
      { transform: 'translateY(-90px) rotate(180deg)', offset: .25 },
      { transform: 'translateY(0) rotate(360deg)', offset: .5 },
      { transform: 'translateY(-90px) rotate(540deg)', offset: .75 },
      { transform: 'translateY(0) rotate(720deg)', offset: 1 }
    ],
    { duration: 2200, easing: 'ease-out' }
  );
  victoryAnimation.onfinish = () => document.body.classList.remove('is-celebrating');
}

function resetCollection() {
  collectedThings.clear();
  document.querySelectorAll('.collection-slot.is-collected').forEach((slot) => slot.classList.remove('is-collected'));
  document.querySelector('.collection-strip')?.classList.remove('is-complete');
  hasWon = false;
}

function shuffleSounds(sounds) {
  const shuffled = [...sounds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function nextSound() {
  if (soundQueue.length === 0) {
    soundQueue = shuffleSounds(soundFiles);
    if (currentSound && soundQueue.length > 1 && soundQueue[soundQueue.length - 1] === currentSound) {
      [soundQueue[0], soundQueue[soundQueue.length - 1]] = [
        soundQueue[soundQueue.length - 1],
        soundQueue[0]
      ];
    }
  }

  return soundQueue.pop();
}

function clearAnimation() {
  window.cancelAnimationFrame(animationTimer);
  window.clearTimeout(talkingDelay);
  animationTimer = null;
  talkingDelay = null;
  finishTimers.forEach(window.clearTimeout);
  finishTimers = [];
  angryBirds.forEach((angryBird) => {
    angryBird.getAnimations().forEach((animation) => animation.cancel());
    angryBird.style.display = 'none';
  });
  flyingBanana.getAnimations().forEach((animation) => animation.cancel());
  flyingBanana.style.display = 'none';
  flyingHamster.getAnimations().forEach((animation) => animation.cancel());
  flyingHamster.style.display = 'none';
  flyingWater.getAnimations().forEach((animation) => animation.cancel());
  flyingWater.style.display = 'none';
  flyingSandwich.getAnimations().forEach((animation) => animation.cancel());
  flyingSandwich.style.display = 'none';
  flyingFish.forEach((fish) => {
    fish.getAnimations().forEach((animation) => animation.cancel());
    fish.style.display = 'none';
  });
  slingshot.getAnimations().forEach((animation) => animation.cancel());
  slingshot.style.display = 'none';
  splitPins.forEach((splitPin) => {
    splitPin.getAnimations().forEach((animation) => animation.cancel());
    splitPin.style.display = 'none';
  });
  Object.values(splitVoices).forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
  });
  activeSplitVoice = null;
  splitEffectTimers.forEach(window.clearTimeout);
  splitEffectTimers = [];
  window.clearTimeout(danceFadeTimer);
  danceFadeTimer = null;
  danceVoice.pause();
  danceVoice.currentTime = 0;
  danceVoice.volume = 1;
  danceVoice.ontimeupdate = null;
  document.body.classList.remove('is-dancing');
  window.cancelAnimationFrame(splitMouthTimer);
  splitMouthTimer = null;
  pin.style.visibility = '';
}

function showFrame(src, flipped = false) {
  pin.src = src;
  pin.classList.toggle('is-flipped', flipped);
}

function flyAngryBirds() {
  angryBirds.forEach((angryBird, index) => {
    angryBird.style.display = 'block';
    const flight = angryBird.animate(
      [
        { transform: 'translate3d(-170px, 12px, 0) rotate(-7deg)', offset: 0 },
        { transform: 'translate3d(calc(50vw - 50%), -12px, 0) rotate(2deg)', offset: .52 },
        { transform: 'translate3d(calc(100vw + 170px), 6px, 0) rotate(7deg)', offset: 1 }
      ],
      {
        duration: 1800,
        delay: index * 300,
        easing: 'linear',
        fill: 'backwards'
      }
    );
    flight.onfinish = () => {
      angryBird.style.display = 'none';
    };
  });
}

function flyBanana() {
  flyingBanana.style.display = 'block';
  const bananaFlight = flyingBanana.animate(
    [
      { transform: 'translate3d(-120px, 10px, 0) rotate(-25deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -14px, 0) rotate(18deg)', offset: .52 },
      { transform: 'translate3d(calc(100vw + 120px), 8px, 0) rotate(65deg)', offset: 1 }
    ],
    {
      duration: 1800,
      easing: 'linear',
      fill: 'backwards'
    }
  );
  bananaFlight.onfinish = () => {
    flyingBanana.style.display = 'none';
  };
}

function flyHamster() {
  flyingHamster.style.display = 'block';
  const hamsterFlight = flyingHamster.animate(
    [
      { transform: 'translate3d(calc(100vw + 130px), 8px, 0) rotate(12deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -16px, 0) rotate(-8deg)', offset: .52 },
      { transform: 'translate3d(-130px, 10px, 0) rotate(-25deg)', offset: 1 }
    ],
    {
      duration: 1800,
      easing: 'linear',
      fill: 'backwards'
    }
  );
  hamsterFlight.onfinish = () => {
    flyingHamster.style.display = 'none';
  };
}

function flyWater() {
  flyingWater.style.display = 'block';
  const waterFlight = flyingWater.animate(
    [
      { transform: 'translate3d(-150px, 8px, 0) rotate(-6deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -12px, 0) rotate(5deg)', offset: .52 },
      { transform: 'translate3d(calc(100vw + 150px), 10px, 0) rotate(-4deg)', offset: 1 }
    ],
    {
      duration: 1800,
      easing: 'linear',
      fill: 'backwards'
    }
  );
  waterFlight.onfinish = () => {
    flyingWater.style.display = 'none';
  };
}

function flySandwich() {
  flyingSandwich.style.display = 'block';
  const sandwichFlight = flyingSandwich.animate(
    [
      { transform: 'translate3d(calc(100vw + 140px), 10px, 0) rotate(18deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -14px, 0) rotate(-10deg)', offset: .52 },
      { transform: 'translate3d(-140px, 8px, 0) rotate(-35deg)', offset: 1 }
    ],
    {
      duration: 1800,
      easing: 'linear',
      fill: 'backwards'
    }
  );
  sandwichFlight.onfinish = () => {
    flyingSandwich.style.display = 'none';
  };
}

function flyFishSchool() {
  flyingFish.forEach((fish, index) => {
    const fliesLeftToRight = Math.random() < .5;
    const startX = fliesLeftToRight ? '-130px' : 'calc(100vw + 130px)';
    const endX = fliesLeftToRight ? 'calc(100vw + 130px)' : '-130px';
    const facing = fliesLeftToRight ? -1 : 1;
    fish.style.display = 'block';
    const fishFlight = fish.animate(
      [
        { transform: `translate3d(${startX}, 8px, 0) scaleX(${facing}) rotate(-5deg)`, offset: 0 },
        { transform: `translate3d(calc(50vw - 50%), -14px, 0) scaleX(${facing}) rotate(4deg)`, offset: .52 },
        { transform: `translate3d(${endX}, 9px, 0) scaleX(${facing}) rotate(-3deg)`, offset: 1 }
      ],
      {
        duration: 2600,
        delay: index * 340,
        easing: 'linear',
        fill: 'backwards'
      }
    );
    fishFlight.onfinish = () => {
      fish.style.display = 'none';
    };
  });
}

function flySlingshot() {
  slingshot.style.display = 'block';
  const flight = slingshot.animate(
    [
      { transform: 'translate3d(calc(100vw + 190px), 8px, 0) rotate(8deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -10px, 0) rotate(-2deg)', offset: .52 },
      { transform: 'translate3d(-190px, 7px, 0) rotate(-8deg)', offset: 1 }
    ],
    {
      duration: 1600,
      easing: 'linear'
    }
  );
  flight.onfinish = () => {
    slingshot.style.display = 'none';
  };
}

function splitIntoTwo() {
  const distance = Math.min(window.innerWidth * .25, 115);
  pin.style.visibility = 'hidden';

  splitPins.forEach((splitPin, index) => {
    const direction = index === 0 ? -1 : 1;
    splitPin.src = idleFrame;
    splitPin.style.display = 'block';
    splitPin.animate(
      [
        { transform: 'translateX(-50%) translateX(0) translateY(0) rotate(0deg)', offset: 0 },
        {
          transform: `translateX(-50%) translateX(${direction * distance}px) translateY(0) rotate(${direction * 3}deg)`,
          offset: 1,
          easing: 'cubic-bezier(.2, .8, .2, 1)'
        }
      ],
      { duration: 450, fill: 'forwards' }
    );
  });

  voice.pause();
  playSplitEffect(0, distance);
  splitEffectTimers.push(window.setTimeout(() => mergeSplitPins(distance), 7000));
}

function playSplitEffect(index, distance) {
  const effects = [
    { pin: 0, file: 'sounds/fluffmuffin!.mp3' },
    { pin: 1, file: 'sounds/hamster.mp3' },
    { pin: 0, file: 'sounds/fluffmuffin!.mp3' },
    { pin: 1, file: 'sounds/hamster.mp3' }
  ];

  if (index >= effects.length) {
    mergeSplitPins(distance);
    return;
  }

  splitPins.forEach((splitPin, pinIndex) => {
    splitPin.src = pinIndex === effects[index].pin ? talkingFrames[1] : idleFrame;
  });
  activeSplitVoice = effects[index].pin === 0 ? splitVoices.fluff : splitVoices.hamster;
  activeSplitVoice.currentTime = 0;
  window.cancelAnimationFrame(splitMouthTimer);
  const animateSplitMouth = () => {
    if (activeSplitVoice !== (effects[index].pin === 0 ? splitVoices.fluff : splitVoices.hamster)
      || activeSplitVoice.paused) return;
    const mouthFrame = Math.floor(activeSplitVoice.currentTime / 0.14) % 2 === 1
      ? talkingFrames[1]
      : talkingFrames[0];
    splitPins[effects[index].pin].src = mouthFrame;
    splitMouthTimer = window.requestAnimationFrame(animateSplitMouth);
  };
  splitMouthTimer = window.requestAnimationFrame(animateSplitMouth);
  activeSplitVoice.onended = () => playSplitEffect(index + 1, distance);
  activeSplitVoice.play().catch(() => playSplitEffect(index + 1, distance));
  if (Number.isFinite(activeSplitVoice.duration)) {
    splitEffectTimers.push(window.setTimeout(() => {
      if (activeSplitVoice === (effects[index].pin === 0 ? splitVoices.fluff : splitVoices.hamster)) {
        activeSplitVoice.pause();
        activeSplitVoice.onended = null;
        playSplitEffect(index + 1, distance);
      }
    }, Math.max(0, (activeSplitVoice.duration - 0.1) * 1000)));
  }
}

function mergeSplitPins(distance) {
  if (activeSplitVoice) {
    activeSplitVoice.pause();
    activeSplitVoice.onended = null;
  }
  splitPins.forEach((splitPin, index) => {
    const direction = index === 0 ? -1 : 1;
    splitPin.src = idleFrame;
    const mergeAnimation = splitPin.animate(
      [
        {
          transform: `translateX(-50%) translateX(${direction * distance}px) translateY(0) rotate(${direction * 3}deg)`,
          offset: 0
        },
        {
          transform: `translateX(-50%) translateX(${direction * distance * .48}px) translateY(-48px) rotate(${direction * -5}deg)`,
          offset: .42,
          easing: 'cubic-bezier(.3, 0, .5, 1)'
        },
        {
          transform: 'translateX(-50%) translateX(0) translateY(0) rotate(0deg)',
          offset: 1,
          easing: 'cubic-bezier(.15, .9, .3, 1.25)'
        }
      ],
      { duration: 650, fill: 'forwards' }
    );

    if (index === splitPins.length - 1) mergeAnimation.onfinish = resetToIdle;
  });
}

function explodeFlyby(event) {
  event.preventDefault();
  event.stopPropagation();
  const flyby = event.currentTarget;
  if (flyby.style.display !== 'block') return;
  ignorePinUntil = performance.now() + 750;
  collectThing(flyby.dataset.collectible);
  const popSound = bubbleBreak.cloneNode(true);
  popSound.currentTime = 0;
  popSound.play().catch(() => {});

  const rect = flyby.getBoundingClientRect();
  flyby.getAnimations().forEach((animation) => animation.cancel());
  flyby.style.display = 'none';

  const burst = document.createElement('span');
  burst.className = 'bird-explosion';
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  const colors = ['#e80035', '#ffbd25', '#171717', '#f6e4ce'];

  for (let index = 0; index < 24; index += 1) {
    const particle = document.createElement('i');
    particle.style.setProperty('--angle', `${index * (360 / 24)}deg`);
    particle.style.setProperty('--distance', `${100 + Math.random() * 90}px`);
    particle.style.setProperty('--color', colors[index % colors.length]);
    burst.appendChild(particle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1100);
}

function startTalking() {
  clearAnimation();
  document.body.classList.add('is-playing');
  document.body.classList.add('is-talking');
  mouthOpen = false;
  lastMouthChange = 0;
  showFrame(idleFrame);

  const animateMouth = (now) => {
    const hasFlyby = currentSound.endsWith('sound3.mp3')
      || currentSound.endsWith('slingshot.mp3')
      || currentSound.endsWith('banana.mp3')
      || currentSound.endsWith('fluffmuffin.mp3')
      || currentSound.endsWith('bay.mp3')
      || currentSound.endsWith('tunes.mp3')
      || currentSound.endsWith('goldfish.mp3');
    const endingLead = currentSound.endsWith('both.mp3') ? 0 : (hasFlyby ? 0.38 : 0.22);
    const playbackTime = voice.currentTime;
    if (voice.duration && playbackTime >= voice.duration - endingLead) {
      finishTalking();
      return;
    }

    const shouldOpen = Math.floor(playbackTime / 0.14) % 2 === 1;

    if (shouldOpen !== mouthOpen && now - lastMouthChange > 85) {
      mouthOpen = shouldOpen;
      lastMouthChange = now;
      showFrame(mouthOpen ? talkingFrames[1] : talkingFrames[0]);
    }

    animationTimer = window.requestAnimationFrame(animateMouth);
  };

  animationTimer = window.requestAnimationFrame(animateMouth);
}

function finishTalking() {
  if (isFinishing) return;
  isFinishing = true;
  const currentTransform = window.getComputedStyle(pin).transform;
  clearAnimation();
  document.body.classList.remove('is-talking');
  showFrame(idleFrame);

  if (currentSound.endsWith('discohall.mp3')) {
    startDiscoDance();
    return;
  }

  if (currentSound.endsWith('faceplant.mp3')) {
    const faceplantRecovery = pin.animate(
      [
        { transform: currentTransform, offset: 0 },
        { transform: 'translateY(-8px) rotate(4deg)', offset: .1 },
        {
          transform: 'translateX(-18px) translateY(20px) rotate(-18deg)',
          offset: .2,
          easing: 'cubic-bezier(.65, 0, 1, .4)'
        },
        {
          transform: 'translateX(-80px) translateY(68px) rotate(-58deg) scale(.87)',
          offset: .3,
          easing: 'cubic-bezier(.7, 0, 1, .45)'
        },
        {
          transform: 'translateX(-105px) translateY(94px) rotate(-68deg) scale(.84)',
          offset: .36,
          easing: 'cubic-bezier(.12, .85, .2, 1)'
        },
        { transform: 'translateX(-105px) translateY(94px) rotate(-68deg) scale(.84)', offset: .84 },
        {
          transform: 'translateX(-52px) translateY(45px) rotate(-35deg) scale(.92)',
          offset: .9,
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: .98 },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 }
      ],
      {
        duration: 1800,
        easing: 'linear'
      }
    );
    faceplantRecovery.onfinish = resetToIdle;
    finishTimers.push(window.setTimeout(() => showFrame('images/3.png'), 520));
    finishTimers.push(window.setTimeout(() => showFrame(idleFrame), 1580));
    finishTimers.push(window.setTimeout(resetToIdle, 2050));
    return;
  }

  if (currentSound.endsWith('sound2.mp3')) {
    const fallRecovery = pin.animate(
      [
        {
          transform: currentTransform,
          offset: 0,
          easing: 'cubic-bezier(.4, 0, .8, .7)'
        },
        { transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)', offset: .185 },
        { transform: 'translateX(-175px) translateY(-5px) rotate(84deg) scale(.72)', offset: .265 },
        { transform: 'translateX(-175px) translateY(2px) rotate(92deg) scale(.72)', offset: .345 },
        { transform: 'translateX(-175px) translateY(-4px) rotate(86deg) scale(.72)', offset: .424 },
        { transform: 'translateX(-175px) translateY(0) rotate(90deg) scale(.72)', offset: .504 },
        { transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)', offset: .557 },
        {
          transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)',
          offset: .72,
          easing: 'cubic-bezier(.18, .8, .3, 1)'
        },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: .96 },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 }
      ],
      {
        duration: 2400,
        easing: 'linear'
      }
    );
    fallRecovery.onfinish = resetToIdle;
    finishTimers.push(window.setTimeout(resetToIdle, 2600));
    return;
  }

  if (currentSound.endsWith('both.mp3')) {
    splitIntoTwo();
    return;
  }

  pin.animate(
    [
      { transform: currentTransform },
      { transform: 'translateY(0) rotate(0deg)' }
    ],
    {
      duration: 320,
      easing: 'cubic-bezier(.22, 1, .36, 1)'
    }
  );

  if (currentSound.endsWith('sound3.mp3')) {
    flyAngryBirds();
    finishTimers.push(window.setTimeout(resetToIdle, 2150));
  } else if (currentSound.endsWith('slingshot.mp3')) {
    flySlingshot();
    finishTimers.push(window.setTimeout(resetToIdle, 1650));
  } else if (currentSound.endsWith('banana.mp3')) {
    flyBanana();
    finishTimers.push(window.setTimeout(resetToIdle, 1850));
  } else if (currentSound.endsWith('fluffmuffin.mp3')) {
    flyHamster();
    finishTimers.push(window.setTimeout(resetToIdle, 1850));
  } else if (currentSound.endsWith('bay.mp3')) {
    flyWater();
    finishTimers.push(window.setTimeout(resetToIdle, 1850));
  } else if (currentSound.endsWith('tunes.mp3')) {
    flySandwich();
    finishTimers.push(window.setTimeout(resetToIdle, 1850));
  } else if (currentSound.endsWith('goldfish.mp3')) {
    flyFishSchool();
    finishTimers.push(window.setTimeout(resetToIdle, 3400));
  } else {
    finishTimers.push(window.setTimeout(resetToIdle, 320));
  }
}

function startDiscoDance() {
  document.body.classList.add('is-dancing');
  danceVoice.currentTime = 0;
  danceVoice.volume = 1;
  danceVoice.ontimeupdate = () => {
    const fadeDuration = 1.7;
    const remaining = danceVoice.duration - danceVoice.currentTime;
    if (Number.isFinite(remaining) && remaining <= fadeDuration) {
      danceVoice.volume = Math.max(0, remaining / fadeDuration);
    }
  };
  danceVoice.play().catch(() => resetToIdle());
  danceVoice.onended = resetToIdle;
}

function resetToIdle() {
  clearAnimation();
  isFinishing = false;
  showFrame(idleFrame);
  document.body.classList.remove('is-playing');
  document.body.classList.remove('is-talking');
  isRoutineActive = false;
}

async function play() {
  if (performance.now() < ignorePinUntil) return;
  if (isRoutineActive) return;
  if (hasWon) resetCollection();
  isRoutineActive = true;

  isFinishing = false;
  document.body.classList.add('has-played');

  try {
    currentSound = nextSound();
    voice.src = currentSound;
    voice.load();
    voice.currentTime = 0;
    await voice.play();
  } catch {
    resetToIdle();
  }
}

button.addEventListener('touchstart', () => {
  play();
}, { passive: true });
button.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.pointerType === 'touch') return;
  play();
});
button.addEventListener('click', () => {
  play();
});
angryBirds.forEach((angryBird) => angryBird.addEventListener('pointerdown', explodeFlyby));
flyingBanana.addEventListener('pointerdown', explodeFlyby);
flyingHamster.addEventListener('pointerdown', explodeFlyby);
flyingWater.addEventListener('pointerdown', explodeFlyby);
flyingSandwich.addEventListener('pointerdown', explodeFlyby);
flyingFish.forEach((fish) => fish.addEventListener('pointerdown', explodeFlyby));
slingshot.addEventListener('pointerdown', explodeFlyby);

voice.addEventListener('playing', () => {
  clearAnimation();
  showFrame(idleFrame);
  talkingDelay = window.setTimeout(startTalking, 160);
});
voice.addEventListener('ended', finishTalking);

function stopPlayback() {
  voice.pause();
  voice.currentTime = 0;
  resetToIdle();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPlayback();
});
window.addEventListener('pagehide', stopPlayback);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then((registration) => registration.update());
  });
}
