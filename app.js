const button = document.querySelector('.pin-button');
const pin = document.querySelector('.pin');
const voice = document.querySelector('.voice');

const idleFrame = 'images/1.png';
const talkingFrames = ['images/1.png', 'images/5.png'];
const allFrames = [idleFrame, ...talkingFrames];
const soundFiles = [
  'sounds/cantgetme.mp3',
  'sounds/sound2.mp3',
  'sounds/sound3.mp3'
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
let mouthOpen = false;
let lastMouthChange = 0;
let mouthOpenedAt = 0;
let isFinishing = false;
let playCount = 0;
let currentSound = soundFiles[0];

soundFiles.slice(1).forEach((src) => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = src;
});

function prepareAudioAnalysis() {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.55;
    waveform = new Uint8Array(analyser.fftSize);

    const source = audioContext.createMediaElementSource(voice);
    source.connect(analyser);
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
}

function showFrame(src, flipped = false) {
  pin.src = src;
  pin.classList.toggle('is-flipped', flipped);
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
    if (voice.duration && voice.currentTime >= voice.duration - 0.22) {
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
      shouldOpen = Math.floor(voice.currentTime / 0.14) % 2 === 1;
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
        { transform: 'translateX(-175px) translateY(0) rotate(88deg) scale(.72)', offset: .93 },
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

  finishTimers.push(window.setTimeout(resetToIdle, 320));
}

function resetToIdle() {
  clearAnimation();
  isFinishing = false;
  showFrame(idleFrame);
  document.body.classList.remove('is-playing');
  document.body.classList.remove('is-talking');
}

async function play() {
  if (isFinishing) {
    resetToIdle();
    pin.getAnimations().forEach((animation) => animation.cancel());
  }

  prepareAudioAnalysis();
  isFinishing = false;
  document.body.classList.add('has-played');

  try {
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

button.addEventListener('click', play);
voice.addEventListener('playing', () => {
  clearAnimation();
  showFrame(idleFrame);
  talkingDelay = window.setTimeout(startTalking, 160);
});
voice.addEventListener('ended', finishTalking);
voice.addEventListener('pause', () => {
  if (voice.currentTime < voice.duration) resetToIdle();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}
