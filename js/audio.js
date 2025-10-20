// Audio Module V2 - Sample-Based with Spatial Effects
// Simplified, user-friendly audio system using real firework samples

let audioContext;
let masterGain;

// Audio samples storage
const audioSamples = {
    launch: [],
    explosion: [],
    ambient: [],
    loaded: false,
    useFallback: false
};

// Simplified audio configuration
const audioConfig = {
    volume: 0.7,
    preset: 'realistic',
    reverbAmount: 0.4,
    enabled: true
};

// Simplified presets - easy to understand
const audioPresets = {
    realistic: {
        volumeMultiplier: 1.0,
        reverbAmount: 0.4,
        playbackRateVariation: 0.1,
        distanceFalloff: 0.5
    },
    epic: {
        volumeMultiplier: 1.2,
        reverbAmount: 0.7,
        playbackRateVariation: 0.05,
        distanceFalloff: 0.3
    },
    minimal: {
        volumeMultiplier: 0.7,
        reverbAmount: 0.15,
        playbackRateVariation: 0.05,
        distanceFalloff: 0.7
    },
    cartoonish: {
        volumeMultiplier: 1.0,
        reverbAmount: 0.2,
        playbackRateVariation: 0.15,
        distanceFalloff: 0.4
    },
    balanced: {
        volumeMultiplier: 0.9,
        reverbAmount: 0.3,
        playbackRateVariation: 0.08,
        distanceFalloff: 0.45
    }
};

// Sample file paths
const samplePaths = {
    launch: [
        // No launch sounds yet - will use synthesis fallback
    ],
    explosion: [
        'sounds/explosion/firework 1.ogg',
        'sounds/explosion/firework 2.ogg',
        'sounds/explosion/firework 3.ogg'
    ]
};

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain node
        masterGain = audioContext.createGain();
        masterGain.gain.value = audioConfig.volume;
        masterGain.connect(audioContext.destination);
        
        // Start loading samples
        loadAllSamples();
    }
}

// Load a single audio sample
async function loadAudioSample(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.warn(`Failed to load audio sample: ${url}`, error);
        return null;
    }
}

// Load all audio samples
async function loadAllSamples() {
    if (audioSamples.loaded) return;
    
    console.log('Loading audio samples...');
    
    try {
        // Load launch sounds
        const launchPromises = samplePaths.launch.map(path => loadAudioSample(path));
        const launchBuffers = await Promise.all(launchPromises);
        audioSamples.launch = launchBuffers.filter(b => b !== null);
        
        // Load explosion sounds
        const explosionPromises = samplePaths.explosion.map(path => loadAudioSample(path));
        const explosionBuffers = await Promise.all(explosionPromises);
        audioSamples.explosion = explosionBuffers.filter(b => b !== null);
        
        // Check if we got any samples
        if (audioSamples.launch.length === 0 && audioSamples.explosion.length === 0) {
            console.warn('No audio samples loaded, using fallback synthesis');
            audioSamples.useFallback = true;
        } else {
            console.log(`Loaded ${audioSamples.launch.length} launch and ${audioSamples.explosion.length} explosion samples`);
            audioSamples.loaded = true;
        }
    } catch (error) {
        console.error('Error loading audio samples:', error);
        audioSamples.useFallback = true;
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
    const preset = audioPresets[audioConfig.preset];
    const centerX = window.canvas.width / 2;
    const centerY = window.canvas.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    const maxDistance = Math.hypot(window.canvas.width / 2, window.canvas.height / 2);
    const normalizedDistance = distance / maxDistance;
    return 1 - (normalizedDistance * preset.distanceFalloff);
}

// Play explosion sound using sample
function playExplosionSound(x, y) {
    if (!audioContext || !audioConfig.enabled) return;
    
    // Use fallback if samples not loaded
    if (audioSamples.useFallback || audioSamples.explosion.length === 0) {
        playExplosionSoundFallback(x, y);
        return;
    }
    
    const preset = audioPresets[audioConfig.preset];
    
    // Select random sample
    const sampleIndex = Math.floor(Math.random() * audioSamples.explosion.length);
    const buffer = audioSamples.explosion[sampleIndex];
    
    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Playback rate variation (pitch)
    const rateVariation = preset.playbackRateVariation;
    source.playbackRate.value = 1.0 + (Math.random() - 0.5) * rateVariation * 2;
    
    // Create audio nodes
    const gainNode = audioContext.createGain();
    const panner = createPanner(x);
    const reverb = createReverb();
    const reverbGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Audio routing
    source.connect(dryGain);
    dryGain.connect(gainNode);
    source.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Apply settings
    const distanceVolume = getDistanceVolume(x, y);
    const reverbAmount = audioConfig.reverbAmount !== undefined ? audioConfig.reverbAmount : preset.reverbAmount;
    
    gainNode.gain.value = distanceVolume * preset.volumeMultiplier;
    dryGain.gain.value = 1 - reverbAmount;
    reverbGain.gain.value = reverbAmount;
    
    // Play
    source.start(audioContext.currentTime);
}

// Fallback: Synthesized explosion sound (simplified from original)
function playExplosionSoundFallback(x, y) {
    const preset = audioPresets[audioConfig.preset];
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
    const reverbAmount = audioConfig.reverbAmount !== undefined ? audioConfig.reverbAmount : preset.reverbAmount;
    dryGain.gain.value = 1 - reverbAmount;
    reverbGain.gain.value = reverbAmount;
    
    // Filter settings
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
    
    // Volume envelope
    const baseVolume = 0.3 * distanceVolume * preset.volumeMultiplier;
    gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.3);
}

// Play launch sound using sample
function playLaunchSound(x, y) {
    if (!audioContext || !audioConfig.enabled) return;
    
    // Skip if no samples loaded
    if (audioSamples.useFallback || audioSamples.launch.length === 0) {
        return; // No fallback for launch sounds
    }
    
    const preset = audioPresets[audioConfig.preset];
    
    // Select random sample
    const sampleIndex = Math.floor(Math.random() * audioSamples.launch.length);
    const buffer = audioSamples.launch[sampleIndex];
    
    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Playback rate variation
    const rateVariation = preset.playbackRateVariation;
    source.playbackRate.value = 1.0 + (Math.random() - 0.5) * rateVariation * 2;
    
    // Create audio nodes
    const gainNode = audioContext.createGain();
    const panner = createPanner(x);
    
    // Simple routing (no reverb for launch)
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Apply settings
    const distanceVolume = getDistanceVolume(x, y);
    gainNode.gain.value = distanceVolume * preset.volumeMultiplier * 0.5; // Quieter than explosions
    
    // Play
    source.start(audioContext.currentTime);
}

// Export to global scope
window.audioContext = audioContext;
window.masterGain = masterGain;
window.audioConfig = audioConfig;
window.audioPresets = audioPresets;
window.audioSamples = audioSamples;
window.initAudio = initAudio;
window.loadAllSamples = loadAllSamples;
window.playExplosionSound = playExplosionSound;
window.playLaunchSound = playLaunchSound;
