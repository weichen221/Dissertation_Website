/**
 * Bio-Acoustic Synthesizer using Web Audio API
 * Generates natural, organic soundscapes for diurnal birds and nocturnal creatures
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Master volume control to keep it gentle and pleasant
function createMasterGain(ctx: AudioContext, duration: number): GainNode {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.08, ctx.currentTime); // Gentle start volume
  masterGain.connect(ctx.destination);
  return masterGain;
}

/**
 * Play a specific synthesized ecological sound based on index and daytime
 */
export function playBioSound(index: number, isDaytime: boolean) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (isDaytime) {
      // Diurnal Birds
      switch (index) {
        case 0: // Robin (知更鸟) - High whistling sweet melody
          playRobin(ctx, now);
          break;
        case 1: // Blue Tit (蓝山雀) - Rapid high-pitched trill
          playBlueTit(ctx, now);
          break;
        case 2: // Goldfinch (金翅雀) - Cheerful, bubbling leap whistle
          playGoldfinch(ctx, now);
          break;
        case 3: // Song Thrush (歌鸫) - Repeated short clear phrases
          playSongThrush(ctx, now);
          break;
        case 4: // Nightingale (夜莺) - Deep rich slide whistle then fast clicks
          playNightingale(ctx, now);
          break;
        case 5: // Wren (鹪鹩) - Long, cascading rapid chirps
          playWren(ctx, now);
          break;
        case 6: // Chaffinch (苍头燕雀) - Descending cascade with final flourish
          playChaffinch(ctx, now);
          break;
        case 7: // Blackbird (乌鸫) - Mellow, rich flutey whistles
          playBlackbird(ctx, now);
          break;
        default:
          playRobin(ctx, now);
      }
    } else {
      // Nocturnal Creatures (Bats, Owls, Insects)
      switch (index) {
        case 0: // Pipistrelle Bat (伏翼蝠) - Rapid clicks sweeping from 15kHz down
          playBat(ctx, now);
          break;
        case 1: // Tawny Owl (灰林鸮) - Spooky double hoot
          playOwl(ctx, now);
          break;
        case 2: // Field Cricket (田野蟋蟀) - Classic fast mechanical chirp pulse
          playCricket(ctx, now);
          break;
        case 3: // Nightjar (欧夜鹰) - Motor-like continuous churring
          playNightjar(ctx, now);
          break;
        case 4: // Barn Owl (草鸮) - Rasping ghostly screech
          playBarnOwl(ctx, now);
          break;
        case 5: // Common Toad (大蟾蜍) - High soft trilled squeaks
          playToad(ctx, now);
          break;
        case 6: // Bush Cricket (螽斯) - Continuous sharp buzzing tsss-tsss
          playBushCricket(ctx, now);
          break;
        case 7: // Moth Flutter (蛾翼) - Ultra-low soft brushing wing beats
          playMothFlutter(ctx, now);
          break;
        default:
          playCricket(ctx, now);
      }
    }
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by user gesture:", e);
  }
}

/* --- DIURNAL BIRD SYNTHESISERS --- */

function playRobin(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.45);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(3200, now);
  osc.frequency.exponentialRampToValueAtTime(5600, now + 0.12);
  osc.frequency.setValueAtTime(4500, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(3000, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(6200, now + 0.42);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
  gain.gain.setValueAtTime(0, now + 0.14);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.17);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

  osc.start(now);
  osc.stop(now + 0.45);
}

function playBlueTit(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.48);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(6500, now);
  osc.frequency.setValueAtTime(6500, now + 0.1);
  osc.frequency.setValueAtTime(6200, now + 0.12);

  for (let i = 0; i < 7; i++) {
    const t = now + 0.18 + i * 0.04;
    osc.frequency.setValueAtTime(i % 2 === 0 ? 4600 : 4100, t);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  for (let i = 0; i < 7; i++) {
    const t = now + 0.18 + i * 0.04;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  }

  osc.start(now);
  osc.stop(now + 0.48);
}

function playGoldfinch(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.4);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(2900, now);
  osc.frequency.exponentialRampToValueAtTime(5200, now + 0.06);
  osc.frequency.exponentialRampToValueAtTime(3400, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(5600, now + 0.18);
  osc.frequency.exponentialRampToValueAtTime(3100, now + 0.24);
  osc.frequency.exponentialRampToValueAtTime(6000, now + 0.35);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.39);

  osc.start(now);
  osc.stop(now + 0.4);
}

function playSongThrush(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.4);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(4200, now);
  osc.frequency.exponentialRampToValueAtTime(3000, now + 0.08);
  osc.frequency.setValueAtTime(4200, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(3000, now + 0.2);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  gain.gain.setValueAtTime(0, now + 0.11);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.13);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.start(now);
  osc.stop(now + 0.25);
}

function playNightingale(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.45);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(1600, now);
  osc.frequency.exponentialRampToValueAtTime(3400, now + 0.16);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.16);

  for (let i = 0; i < 5; i++) {
    const t = now + 0.2 + i * 0.05;
    osc.frequency.setValueAtTime(4600, t);
    osc.frequency.setValueAtTime(1300, t + 0.02);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.04);
  }

  osc.start(now);
  osc.stop(now + 0.45);
}

function playWren(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.35);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  for (let i = 0; i < 10; i++) {
    const t = now + i * 0.035;
    const freq = 4200 + Math.sin(i * 1.6) * 1600;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.033);
  }

  osc.start(now);
  osc.stop(now + 0.38);
}

function playChaffinch(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.38);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(5600, now);
  osc.frequency.exponentialRampToValueAtTime(4600, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(3900, now + 0.18);
  osc.frequency.setValueAtTime(6300, now + 0.22);
  osc.frequency.exponentialRampToValueAtTime(3300, now + 0.32);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.2);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.23);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.start(now);
  osc.stop(now + 0.35);
}

function playBlackbird(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.45);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.linearRampToValueAtTime(2300, now + 0.12);
  osc.frequency.linearRampToValueAtTime(1950, now + 0.24);
  osc.frequency.linearRampToValueAtTime(2600, now + 0.38);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.28);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

  osc.start(now);
  osc.stop(now + 0.45);
}

/* --- NOCTURNAL CREATURE SYNTHESISERS --- */

function playBat(ctx: AudioContext, now: number) {
  // Rapid ultrasonic detectors clicks translated to high cyber clicks
  const master = createMasterGain(ctx, 0.2);
  for (let i = 0; i < 6; i++) {
    const t = now + i * 0.04;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(master);

    osc.frequency.setValueAtTime(15000, t);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.012);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

    osc.start(t);
    osc.stop(t + 0.015);
  }
}

function playOwl(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.5);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  // Soft low hoot "Whooo"
  osc.frequency.setValueAtTime(310, now);
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.22);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  // Second hoot: "hu-hoo-hooo"
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.connect(gain2);
  gain2.connect(master);

  const t2 = now + 0.32;
  osc2.frequency.setValueAtTime(300, t2);
  for (let j = 0; j < 8; j++) {
    osc2.frequency.setValueAtTime(320 + Math.sin(j * 1.5) * 18, t2 + j * 0.04);
  }

  gain2.gain.setValueAtTime(0, t2);
  gain2.gain.linearRampToValueAtTime(0.14, t2 + 0.04);
  gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.32);

  osc.start(now);
  osc.stop(now + 0.25);
  osc2.start(t2);
  osc2.stop(t2 + 0.35);
}

function playCricket(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.3);
  for (let i = 0; i < 4; i++) {
    const t = now + i * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(master);

    osc.frequency.setValueAtTime(4800, t);

    for (let j = 0; j < 3; j++) {
      const ct = t + j * 0.025;
      gain.gain.setValueAtTime(0, ct);
      gain.gain.linearRampToValueAtTime(0.15, ct + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.02);
    }

    osc.start(t);
    osc.stop(t + 0.08);
  }
}

function playNightjar(ctx: AudioContext, now: number) {
  // continuous fast churring engine-like rattle
  const master = createMasterGain(ctx, 0.2);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(420, now);

  const duration = 0.55;
  const pulseRate = 32;
  const totalPulses = duration * pulseRate;
  for (let i = 0; i < totalPulses; i++) {
    const t = now + i * (1 / pulseRate);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1 / pulseRate - 0.002);
  }

  osc.start(now);
  osc.stop(now + duration);
}

function playBarnOwl(ctx: AudioContext, now: number) {
  // Ghostly rasping screech
  const master = createMasterGain(ctx, 0.25);
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.Q.setValueAtTime(2.2, now);

  osc.frequency.setValueAtTime(1400, now);
  for (let i = 0; i < 15; i++) {
    osc.frequency.setValueAtTime(1100 + Math.random() * 700, now + i * 0.02);
    filter.frequency.setValueAtTime(1600 + Math.random() * 900, now + i * 0.02);
  }

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.start(now);
  osc.stop(now + 0.3);
}

function playToad(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.35);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(master);

  osc.frequency.setValueAtTime(1550, now);
  for (let i = 0; i < 7; i++) {
    osc.frequency.setValueAtTime(1500 + Math.sin(i * 1.3) * 70, now + i * 0.035);
    gain.gain.setValueAtTime(0, now + i * 0.035);
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.035 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.032);
  }

  osc.start(now);
  osc.stop(now + 0.26);
}

function playBushCricket(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.2);
  for (let i = 0; i < 10; i++) {
    const t = now + i * 0.045;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(master);

    osc.frequency.setValueAtTime(8500, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.start(t);
    osc.stop(t + 0.043);
  }
}

function playMothFlutter(ctx: AudioContext, now: number) {
  const master = createMasterGain(ctx, 0.4);
  for (let i = 0; i < 5; i++) {
    const t = now + i * 0.055 + Math.random() * 0.015;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(master);

    osc.frequency.setValueAtTime(85 + Math.random() * 35, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}
