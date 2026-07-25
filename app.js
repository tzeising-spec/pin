const button = document.querySelector('.pin-button');
const pin = document.querySelector('.pin');
const angryBirds = document.querySelectorAll('.angry-bird');
const flyingBanana = document.querySelector('.flying-banana');
const flyingHamster = document.querySelector('.flying-hamster');
const flyingWater = document.querySelector('.flying-water');
const flyingSandwich = document.querySelector('.flying-sandwich');
const flyingFish = document.querySelectorAll('.flying-fish');
const slingshot = document.querySelector('.slingshot');
const voice = document.querySelector('.voice');

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
  'sounds/swim.mp3'
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
let playCount = 0;
let currentSound = soundFiles[0];
let soundQueue = [];
let ignorePinUntil = 0;

function shuffleSounds(sounds) {
  const shuffled = [...sounds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function nextSound() {
  if (playCount === 0) {
    soundQueue = shuffleSounds(soundFiles.slice(1));
    return soundFiles[0];
  }

  if (soundQueue.length === 0) {
    soundQueue = shuffleSounds(soundFiles);
    if (soundQueue[soundQueue.length - 1] === currentSound) {
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
        duration: 2100,
        delay: index * 280,
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
      duration: 1000,
      easing: 'linear'
    }
  );
  flight.onfinish = () => {
    slingshot.style.display = 'none';
  };
}

function explodeFlyby(event) {
  event.preventDefault();
  event.stopPropagation();
  const flyby = event.currentTarget;
  if (flyby.style.display !== 'block') return;
  ignorePinUntil = performance.now() + 750;

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
      || currentSound.endsWith('swim.mp3');
    const endingLead = hasFlyby ? 0.38 : 0.22;
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

  if (currentSound.endsWith('sound2.mp3')) {
    const fallRecovery = pin.animate(
      [
        { transform: currentTransform, offset: 0 },
        { transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)', offset: .185 },
        { transform: 'translateX(-175px) translateY(-5px) rotate(84deg) scale(.72)', offset: .265 },
        { transform: 'translateX(-175px) translateY(2px) rotate(92deg) scale(.72)', offset: .345 },
        { transform: 'translateX(-175px) translateY(-4px) rotate(86deg) scale(.72)', offset: .424 },
        { transform: 'translateX(-175px) translateY(0) rotate(90deg) scale(.72)', offset: .504 },
        { transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)', offset: .557 },
        {
          transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)',
          offset: .82,
          easing: 'cubic-bezier(.4, 0, .8, .7)'
        },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 }
      ],
      {
        duration: 3000,
        easing: 'cubic-bezier(.22, 1, .36, 1)'
      }
    );
    fallRecovery.onfinish = resetToIdle;
    finishTimers.push(window.setTimeout(resetToIdle, 3400));
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
    finishTimers.push(window.setTimeout(resetToIdle, 1000));
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
  } else if (currentSound.endsWith('swim.mp3')) {
    flyFishSchool();
    finishTimers.push(window.setTimeout(resetToIdle, 2720));
  } else {
    finishTimers.push(window.setTimeout(resetToIdle, 320));
  }
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
  isRoutineActive = true;

  isFinishing = false;
  document.body.classList.add('has-played');

  try {
    currentSound = nextSound();
    voice.src = currentSound;
    voice.load();
    voice.currentTime = 0;
    await voice.play();
    playCount += 1;
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
