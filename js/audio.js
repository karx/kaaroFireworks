// Audio module
// Handles Web Audio API for firework sounds

let audioContext;
let masterGain;

// Audio configuration
const audioConfig = {
    volume: 0.7,
    preset: 'realistic',
    enableCrackling: true
};

// Audio presets
const audioPresets = {
    realistic: {
        launchFreqStart: 200,
        launchFreqEnd: 800,
        launchDuration: 0.3,
        explosionVariations: 3,
        cracklingIntensity: 0.3,
        reverbAmount: 0.4
    },
    cartoonish: {
        launchFreqStart: 400,
        launchFreqEnd: 1200,
        launchDuration: 0.2,
        explosionVariations: 5,
        cracklingIntensity: 0.6,
        reverbAmount: 0.2
    },
    minimal: {
        launchFreqStart: 300,
        launchFreqEnd: 600,
        launchDuration: 0.15,
        explosionVariations: 1,
        cracklingIntensity: 0,
        reverbAmount: 0.1
    },
    epic: {
        launchFreqStart: 150,
        launchFreqEnd: 1000,
        launchDuration: 0.4,
        explosionVariations: 4,
        cracklingIntensity: 0.5,
        reverbAmount: 0.6
    },
    balanced: {
        launchFreqStart: 250,
        launchFreqEnd: 900,
        launchDuration: 0.25,
        explosionVariations: 3,
        cracklingIntensity: 0.4,
        reverbAmount: 0.3
    }
};

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain node for volume control
        masterGain = audioContext.createGain();
        masterGain.gain.value = audioConfig.volume;
        masterGain.connect(audioContext.destination);
    }
}

// Create reverb effect
function createReverb() {
    const convolver = audioContext.createConvolver();
    const rate = audioContext.sampleRate;
    const length = rate * 2;
    const impulse = audioContext.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        impulseL[i] = (Math.random() * 2 - 1) * decay;
        impulseR[i] = (Math.random() * 2 - 1) * decay;
    }
    
    convolver.buffer = impulse;
    return convolver;
}

// Create stereo panner based on position
function createPanner(x) {
    const panner = audioContext.createStereoPanner();
    const normalizedX = (x / window.canvas.width) * 2 - 1; // -1 to 1
    panner.pan.value = Math.max(-1, Math.min(1, normalizedX));
    return panner;
}

// Calculate distance-based volume
function getDistanceVolume(x, y) {
    const centerX = window.canvas.width / 2;
    const centerY = window.canvas.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    const maxDistance = Math.hypot(window.canvas.width / 2, window.canvas.height / 2);
    const normalizedDistance = distance / maxDistance;
    return 1 - (normalizedDistance * 0.5);
}

// Play explosion sound
function playExplosionSound(x, y) {
    if (!audioContext) return;
    
    const preset = audioPresets[audioConfig.preset];
    const variation = Math.floor(Math.random() * preset.explosionVariations);
    const distanceVolume = getDistanceVolume(x, y);
    
    // Create white noise buffer
    const bufferSize = audioContext.sampleRate * 0.5;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const panner = createPanner(x);
    const reverb = createReverb();
    const reverbGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Audio routing
    noise.connect(filter);
    filter.connect(dryGain);
    dryGain.connect(gainNode);
    filter.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Reverb mix
    dryGain.gain.value = 1 - preset.reverbAmount;
    reverbGain.gain.value = preset.reverbAmount;
    
    // Filter settings
    filter.type = 'lowpass';
    const startFreq = 2000 + (variation * 500);
    const endFreq = 100 + (variation * 50);
    filter.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + 0.3);
    
    // Volume envelope
    const baseVolume = 0.3 * distanceVolume;
    gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.3);
    
    // Add crackling sounds
    if (preset.cracklingIntensity > 0 && audioConfig.enableCrackling) {
        playCracklingSound(x, y, preset.cracklingIntensity);
    }
}

// Crackling/popping particle sounds
function playCracklingSound(x, y, intensity) {
    if (!audioContext || intensity === 0) return;
    
    const crackleCount = Math.floor(Math.random() * 5 + 3) * intensity;
    const distanceVolume = getDistanceVolume(x, y);
    
    for (let i = 0; i < crackleCount; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const panner = createPanner(x + (Math.random() - 0.5) * 100);
            
            oscillator.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(masterGain);
            
            const freq = Math.random() * 2000 + 3000;
            oscillator.frequency.value = freq;
            oscillator.type = 'square';
            
            const volume = (Math.random() * 0.05 + 0.02) * intensity * distanceVolume;
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        }, Math.random() * 200 + 50);
    }
}

// Export to global scope
window.audioContext = audioContext;
window.masterGain = masterGain;
window.audioConfig = audioConfig;
window.audioPresets = audioPresets;
window.initAudio = initAudio;
window.createReverb = createReverb;
window.createPanner = createPanner;
window.getDistanceVolume = getDistanceVolume;
window.playExplosionSound = playExplosionSound;
window.playCracklingSound = playCracklingSound;
