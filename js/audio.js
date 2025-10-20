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

// Style-specific audio configurations
// Each firework style can have unique audio characteristics
const styleAudioConfig = {
    sphere: {
        volumeMultiplier: 1.0,
        pitchVariation: 0.2,
        filterFreq: 12000,
        decay: 1.0,
        reverbMultiplier: 1.0,
        description: 'Standard balanced explosion'
    },
    star: {
        volumeMultiplier: 1.1,
        pitchVariation: 0.3,
        filterFreq: 14000, // Brighter/crisper
        decay: 0.9,
        reverbMultiplier: 0.8,
        description: 'Sharp, crisp burst'
    },
    heart: {
        volumeMultiplier: 0.95,
        pitchVariation: 0.15,
        filterFreq: 11000,
        decay: 1.1,
        reverbMultiplier: 1.2,
        description: 'Softer, romantic sound'
    },
    ring: {
        volumeMultiplier: 1.05,
        pitchVariation: 0.25,
        filterFreq: 13000,
        decay: 1.0,
        reverbMultiplier: 1.1,
        description: 'Clear, resonant ring'
    },
    willow: {
        volumeMultiplier: 0.85,
        pitchVariation: 0.1,
        filterFreq: 9000, // Softer, muted
        decay: 1.5, // Longer decay
        reverbMultiplier: 1.3,
        description: 'Soft, drooping trails'
    },
    chrysanthemum: {
        volumeMultiplier: 1.15,
        pitchVariation: 0.35,
        filterFreq: 15000, // Very bright
        decay: 0.8,
        reverbMultiplier: 0.9,
        layered: true, // Enable multi-burst effect
        burstCount: 3,
        burstDelay: 0.05,
        description: 'Multiple pops, complex burst'
    },
    palm: {
        volumeMultiplier: 1.0,
        pitchVariation: 0.2,
        filterFreq: 10000,
        decay: 1.3,
        reverbMultiplier: 1.4,
        description: 'Palm tree cascading effect'
    },
    spiral: {
        volumeMultiplier: 1.05,
        pitchVariation: 0.4, // High variation for spinning effect
        filterFreq: 13000,
        decay: 1.0,
        reverbMultiplier: 1.0,
        sweepFilter: true, // Enable frequency sweep
        description: 'Whooshing, rotating sound'
    },
    crossette: {
        volumeMultiplier: 1.1,
        pitchVariation: 0.3,
        filterFreq: 14000,
        decay: 0.9,
        reverbMultiplier: 0.85,
        layered: true,
        burstCount: 2,
        burstDelay: 0.08,
        description: 'Split burst with secondary pops'
    },
    peony: {
        volumeMultiplier: 1.2,
        pitchVariation: 0.25,
        filterFreq: 12000,
        decay: 1.1,
        reverbMultiplier: 1.0,
        densityEffect: true, // Emphasize dense center
        description: 'Dense, classic firework boom'
    },
    doubleRing: {
        volumeMultiplier: 1.15,
        pitchVariation: 0.2,
        filterFreq: 13000,
        decay: 1.0,
        reverbMultiplier: 1.2,
        layered: true,
        burstCount: 2,
        burstDelay: 0.03, // Quick succession for rings
        description: 'Dual resonant bursts'
    }
};

// Simplified presets - easy to understand
const audioPresets = {
    realistic: {
        useSamples: true,
        volumeMultiplier: 1.0,
        reverbAmount: 0.4,
        playbackRateVariation: 0.2, // Increased from 0.1 for more variety
        distanceFalloff: 0.5
    },
    epic: {
        useSamples: true,
        volumeMultiplier: 1.2,
        reverbAmount: 0.7,
        playbackRateVariation: 0.15, // Increased from 0.05 for more variety
        distanceFalloff: 0.3
    },
    minimal: {
        useSamples: true,
        volumeMultiplier: 0.7,
        reverbAmount: 0.15,
        playbackRateVariation: 0.12, // Increased from 0.05 for more variety
        distanceFalloff: 0.7
    },
    cartoonish: {
        useSamples: true,
        volumeMultiplier: 1.0,
        reverbAmount: 0.2,
        playbackRateVariation: 0.25, // Increased from 0.15 for more variety
        distanceFalloff: 0.4
    },
    balanced: {
        useSamples: true,
        volumeMultiplier: 0.9,
        reverbAmount: 0.3,
        playbackRateVariation: 0.18, // Increased from 0.08 for more variety
        distanceFalloff: 0.45
    },
    synthesized: {
        useSamples: false,
        volumeMultiplier: 1.0,
        reverbAmount: 0.4,
        playbackRateVariation: 0,
        distanceFalloff: 0.5,
        cracklingIntensity: 0.3
    }
};

// Sample file paths
const samplePaths = {
    launch: [
        'sounds/launch/launch_1.ogg'
    ],
    explosion: [
        'sounds/explosion/firework 1.ogg',
        'sounds/explosion/firework 2.ogg'
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

// Create stereo panner based on position with variation
function createPanner(x) {
    const panner = audioContext.createStereoPanner();
    const normalizedX = (x / window.canvas.width) * 2 - 1; // -1 to 1
    
    // Add slight random pan variation (±0.1) for more spatial variety
    const panVariation = (Math.random() - 0.5) * 0.2;
    const finalPan = normalizedX + panVariation;
    
    panner.pan.value = Math.max(-1, Math.min(1, finalPan));
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
function playExplosionSound(x, y, style = 'sphere') {
    if (!audioContext || !audioConfig.enabled) return;
    
    const preset = audioPresets[audioConfig.preset];
    const styleConfig = styleAudioConfig[style] || styleAudioConfig.sphere;
    
    // Use synthesis if preset specifies or samples not available
    if (!preset.useSamples || audioSamples.useFallback || audioSamples.explosion.length === 0) {
        playExplosionSoundFallback(x, y, style);
        return;
    }
    
    // Check if this style uses layered sounds
    if (styleConfig.layered) {
        playLayeredExplosionSound(x, y, style, styleConfig);
        return;
    }
    
    // Play single explosion sound with style-specific characteristics
    playSingleExplosionSound(x, y, style, styleConfig, preset);
}

// Play a single explosion sound with style-specific characteristics
function playSingleExplosionSound(x, y, style, styleConfig, preset) {
    // Select random sample
    const sampleIndex = Math.floor(Math.random() * audioSamples.explosion.length);
    const buffer = audioSamples.explosion[sampleIndex];
    
    // Create source
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Playback rate variation (pitch) - use style-specific variation
    const rateVariation = styleConfig.pitchVariation;
    source.playbackRate.value = 1.0 + (Math.random() - 0.5) * rateVariation * 2;
    
    // Create audio nodes
    const gainNode = audioContext.createGain();
    const panner = createPanner(x);
    const reverb = createReverb();
    const reverbGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Add filter with style-specific frequency
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    // Use style-specific filter frequency with some variation
    const filterVariation = 0.9 + Math.random() * 0.2; // ±10%
    filter.frequency.value = styleConfig.filterFreq * filterVariation;
    filter.Q.value = 0.5 + Math.random() * 1.5;
    
    // Special filter sweep for spiral
    if (styleConfig.sweepFilter) {
        filter.frequency.setValueAtTime(styleConfig.filterFreq * 1.5, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(styleConfig.filterFreq * 0.7, audioContext.currentTime + 0.3);
    }
    
    // Audio routing with filter
    source.connect(filter);
    filter.connect(dryGain);
    dryGain.connect(gainNode);
    filter.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Apply settings with variations
    const distanceVolume = getDistanceVolume(x, y);
    
    // Apply style-specific volume multiplier
    const volumeVariation = 0.85 + Math.random() * 0.3;
    gainNode.gain.value = distanceVolume * preset.volumeMultiplier * styleConfig.volumeMultiplier * volumeVariation;
    
    // Apply style-specific reverb multiplier
    const baseReverb = audioConfig.reverbAmount !== undefined ? audioConfig.reverbAmount : preset.reverbAmount;
    const reverbVariation = 0.8 + Math.random() * 0.4;
    const reverbAmount = Math.min(1.0, Math.max(0, baseReverb * styleConfig.reverbMultiplier * reverbVariation));
    
    dryGain.gain.value = 1 - reverbAmount;
    reverbGain.gain.value = reverbAmount;
    
    // Apply style-specific decay (affects envelope)
    const decayTime = 0.5 * styleConfig.decay;
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + decayTime);
    
    // Add slight random delay
    const randomDelay = Math.random() * 0.03;
    const startTime = audioContext.currentTime + randomDelay;
    
    // Play
    source.start(startTime);
    source.stop(startTime + decayTime);
}

// Play layered explosion sounds for complex effects
function playLayeredExplosionSound(x, y, style, styleConfig) {
    const preset = audioPresets[audioConfig.preset];
    const burstCount = styleConfig.burstCount || 2;
    const burstDelay = styleConfig.burstDelay || 0.05;
    
    // Play multiple bursts with slight delays
    for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
            // Vary volume for each burst (first burst loudest)
            const burstVolume = 1.0 - (i * 0.15);
            const modifiedStyleConfig = {
                ...styleConfig,
                volumeMultiplier: styleConfig.volumeMultiplier * burstVolume
            };
            playSingleExplosionSound(x, y, style, modifiedStyleConfig, preset);
        }, i * burstDelay * 1000);
    }
}

// Fallback: Synthesized explosion sound (simplified from original)
function playExplosionSoundFallback(x, y, style = 'sphere') {
    const styleConfig = styleAudioConfig[style] || styleAudioConfig.sphere;
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
    
    // Add crackling for synthesized preset
    if (preset.cracklingIntensity && preset.cracklingIntensity > 0) {
        playCracklingSound(x, y, preset.cracklingIntensity);
    }
}

// Crackling/popping particle sounds (for synthesized preset)
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
    
    // Playback rate variation (pitch)
    const rateVariation = preset.playbackRateVariation;
    source.playbackRate.value = 1.0 + (Math.random() - 0.5) * rateVariation * 2;
    
    // Create audio nodes
    const gainNode = audioContext.createGain();
    const panner = createPanner(x);
    
    // Simple routing (no filter, no reverb - keep launch sounds clear and audible)
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Apply settings with variations
    const distanceVolume = getDistanceVolume(x, y);
    
    // Add random volume variation (±10%) for launch sounds
    const volumeVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    // Increased volume significantly - launch sounds should be prominent
    gainNode.gain.value = distanceVolume * preset.volumeMultiplier * 1.5 * volumeVariation;
    
    // Add slight random delay (0-20ms)
    const randomDelay = Math.random() * 0.02;
    const startTime = audioContext.currentTime + randomDelay;
    
    // Play
    source.start(startTime);
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
