const button = document.querySelector('.pin-button');
const pin = document.querySelector('.pin');
const angryBirds = document.querySelectorAll('.angry-bird');
const flyingBanana = document.querySelector('.flying-banana');
const slingshot = document.querySelector('.slingshot');
const voice = document.querySelector('.voice');

const idleFrame = 'images/1.png';
const talkingFrames = ['images/1.png', 'images/5.png'];
const allFrames = [idleFrame, ...talkingFrames];
const soundFiles = [
  'sounds/cantgetme.mp3',
  'sounds/sound2.mp3',
  'sounds/sound3.mp3',
  'sounds/slingshot.mp3'
];

allFrames.forEach((frame) => {
  const image = new Image();
  image.src = typeof frame === 'string' ? frame : frame.src;
});

let animationTimer = null;
let finishTimers = [];
let talkingDelay = null;
let audioContext = null;
let analyser = null;
let waveform = null;
let audioElementSource = null;
let isRoutineActive = false;
let mouthOpen = false;
let lastMouthChange = 0;
let mouthOpenedAt = 0;
let isFinishing = false;
let playCount = 0;
let currentSound = soundFiles[0];

function prepareAudioAnalysis() {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.55;
    waveform = new Uint8Array(analyser.fftSize);
    audioElementSource = audioContext.createMediaElementSource(voice);
    audioElementSource.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') audioContext.resume();
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

  flyingBanana.style.display = 'block';
  const bananaFlight = flyingBanana.animate(
    [
      { transform: 'translate3d(-120px, 10px, 0) rotate(-25deg)', offset: 0 },
      { transform: 'translate3d(calc(50vw - 50%), -14px, 0) rotate(18deg)', offset: .52 },
      { transform: 'translate3d(calc(100vw + 120px), 8px, 0) rotate(65deg)', offset: 1 }
    ],
    {
      duration: 1800,
      delay: 600,
      easing: 'linear',
      fill: 'backwards'
    }
  );
  bananaFlight.onfinish = () => {
    flyingBanana.style.display = 'none';
  };
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
  mouthOpenedAt = 0;
  showFrame(idleFrame);

  const animateMouth = (now) => {
    const hasFlyby = currentSound.endsWith('sound3.mp3') || currentSound.endsWith('slingshot.mp3');
    const endingLead = hasFlyby ? 0.38 : 0.22;
    const playbackTime = voice.currentTime;
    if (voice.duration && playbackTime >= voice.duration - endingLead) {
      finishTalking();
      return;
    }

    let shouldOpen;

    if (analyser && waveform) {
      analyser.getByteTimeDomainData(waveform);
      let energy = 0;
      for (const sample of waveform) {
        const centered = (sample - 128) / 128;
        energy += centered * centered;
      }
      const volume = Math.sqrt(energy / waveform.length);
      shouldOpen = mouthOpen ? volume > 0.035 : volume > 0.058;

      // Loud, compressed speech can stay above the threshold for a whole phrase.
      // Add brief closures so the mouth still articulates individual sounds.
      if (mouthOpen && now - mouthOpenedAt > 175) shouldOpen = false;
    } else {
      shouldOpen = Math.floor(playbackTime / 0.14) % 2 === 1;
    }

    if (shouldOpen !== mouthOpen && now - lastMouthChange > 85) {
      mouthOpen = shouldOpen;
      lastMouthChange = now;
      if (mouthOpen) mouthOpenedAt = now;
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
    pin.animate(
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
          offset: .93,
          easing: 'cubic-bezier(.4, 0, .8, .7)'
        },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: .975 },
        { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 }
      ],
      {
        duration: 4300,
        easing: 'cubic-bezier(.22, 1, .36, 1)'
      }
    );
    finishTimers.push(window.setTimeout(resetToIdle, 4300));
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
    finishTimers.push(window.setTimeout(resetToIdle, 2450));
  } else if (currentSound.endsWith('slingshot.mp3')) {
    flySlingshot();
    finishTimers.push(window.setTimeout(resetToIdle, 1000));
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
  if (isRoutineActive) {
    const flybys = [...angryBirds, flyingBanana, slingshot];
    const animationRunning = [pin, ...flybys].some((element) =>
      element.getAnimations().some((animation) => animation.playState === 'running')
    );
    if (!voice.paused || animationRunning) return;
    resetToIdle();
  }
  isRoutineActive = true;

  isFinishing = false;
  document.body.classList.add('has-played');

  try {
    prepareAudioAnalysis();
    if (playCount === 0) {
      currentSound = soundFiles[0];
    } else {
      const choices = soundFiles.filter((src) => src !== currentSound);
      currentSound = choices[Math.floor(Math.random() * choices.length)];
    }
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
slingshot.addEventListener('pointerdown', explodeFlyby);

voice.disableRemotePlayback = true;
voice.setAttribute('x-webkit-airplay', 'deny');
voice.addEventListener('playing', () => {
  clearAnimation();
  showFrame(idleFrame);
  talkingDelay = window.setTimeout(startTalking, 160);
});
voice.addEventListener('ended', finishTalking);

if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = null;
  try { navigator.mediaSession.playbackState = 'none'; } catch {}
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then((registration) => registration.update());
  });
}
