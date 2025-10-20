// Canvas setup
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

// Configuration
const config = {
    gravity: 0.05,
    friction: 0.98,
    colors: [
        '#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00',
        '#ffff00', '#ccff00', '#99ff00', '#66ff00', '#33ff00',
        '#00ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc',
        '#00ffff', '#00ccff', '#0099ff', '#0066ff', '#0033ff',
        '#0000ff', '#3300ff', '#6600ff', '#9900ff', '#cc00ff',
        '#ff00ff', '#ff00cc', '#ff0099', '#ff0066', '#ff0033'
    ],
    particleCount: 100,
    particleSize: 3,
    background: 'starry', // 'black', 'starry', 'city'
    isMobile: window.innerWidth < 768
};

// URL-based configuration sharing
function getConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('config')) {
        try {
            const encoded = params.get('config');
            const decoded = atob(encoded);
            const urlConfig = JSON.parse(decoded);
            
            // Apply URL config
            if (urlConfig.background) config.background = urlConfig.background;
            if (urlConfig.explosionType) selectedExplosionType = urlConfig.explosionType;
            if (urlConfig.audioPreset) audioConfig.preset = urlConfig.audioPreset;
            if (urlConfig.volume !== undefined) audioConfig.volume = urlConfig.volume;
            
            return urlConfig;
        } catch (e) {
            console.error('Invalid config URL:', e);
        }
    }
    return null;
}

function generateShareURL() {
    const shareConfig = {
        background: config.background,
        explosionType: selectedExplosionType,
        audioPreset: audioConfig.preset,
        volume: audioConfig.volume
    };
    
    const encoded = btoa(JSON.stringify(shareConfig));
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?config=${encoded}`;
}

function saveConfiguration(name) {
    const savedConfigs = JSON.parse(localStorage.getItem('fireworksConfigs') || '{}');
    savedConfigs[name] = {
        background: config.background,
        explosionType: selectedExplosionType,
        audioPreset: audioConfig.preset,
        volume: audioConfig.volume,
        timestamp: Date.now()
    };
    localStorage.setItem('fireworksConfigs', JSON.stringify(savedConfigs));
    return Object.keys(savedConfigs).length;
}

function loadConfiguration(name) {
    const savedConfigs = JSON.parse(localStorage.getItem('fireworksConfigs') || '{}');
    if (savedConfigs[name]) {
        const cfg = savedConfigs[name];
        config.background = cfg.background;
        selectedExplosionType = cfg.explosionType;
        audioConfig.preset = cfg.audioPreset;
        audioConfig.volume = cfg.volume;
        
        // Update UI
        updateUIFromConfig();
        return true;
    }
    return false;
}

function getSavedConfigurations() {
    return JSON.parse(localStorage.getItem('fireworksConfigs') || '{}');
}

function deleteConfiguration(name) {
    const savedConfigs = JSON.parse(localStorage.getItem('fireworksConfigs') || '{}');
    delete savedConfigs[name];
    localStorage.setItem('fireworksConfigs', JSON.stringify(savedConfigs));
}

// Screenshot capture
function captureScreenshot() {
    try {
        // Create a temporary canvas with better quality
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy current canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Add watermark
        tempCtx.font = 'bold 24px Arial';
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        tempCtx.textAlign = 'right';
        tempCtx.fillText('Kaaro Fireworks', tempCanvas.width - 20, tempCanvas.height - 20);
        
        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `kaaro-fireworks-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
        
        return true;
    } catch (e) {
        console.error('Screenshot failed:', e);
        return false;
    }
}

// Share screenshot to social media
function shareScreenshot() {
    try {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'fireworks.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Kaaro Fireworks',
                    text: 'Check out my fireworks display!',
                    files: [file],
                    url: generateShareURL()
                });
            } else {
                // Fallback: just download
                captureScreenshot();
            }
        }, 'image/png');
    } catch (e) {
        console.error('Share failed:', e);
        captureScreenshot(); // Fallback to download
    }
}

// Preset shows - choreographed sequences
const presetShows = {
    rainbow: [
        { delay: 0, x: 0.2, y: 0.3, type: 'standard' },
        { delay: 300, x: 0.4, y: 0.25, type: 'star' },
        { delay: 600, x: 0.6, y: 0.3, type: 'heart' },
        { delay: 900, x: 0.8, y: 0.25, type: 'ring' },
        { delay: 1200, x: 0.5, y: 0.2, type: 'chrysanthemum' }
    ],
    
    cascade: [
        { delay: 0, x: 0.1, y: 0.2, type: 'willow' },
        { delay: 200, x: 0.3, y: 0.25, type: 'willow' },
        { delay: 400, x: 0.5, y: 0.3, type: 'willow' },
        { delay: 600, x: 0.7, y: 0.25, type: 'willow' },
        { delay: 800, x: 0.9, y: 0.2, type: 'willow' }
    ],
    
    finale: [
        { delay: 0, x: 0.2, y: 0.4, type: 'chrysanthemum' },
        { delay: 100, x: 0.4, y: 0.35, type: 'palm' },
        { delay: 200, x: 0.6, y: 0.35, type: 'chrysanthemum' },
        { delay: 300, x: 0.8, y: 0.4, type: 'palm' },
        { delay: 500, x: 0.3, y: 0.25, type: 'star' },
        { delay: 600, x: 0.5, y: 0.2, type: 'heart' },
        { delay: 700, x: 0.7, y: 0.25, type: 'star' },
        { delay: 1000, x: 0.5, y: 0.3, type: 'ring' }
    ],
    
    symmetry: [
        { delay: 0, x: 0.25, y: 0.3, type: 'star' },
        { delay: 0, x: 0.75, y: 0.3, type: 'star' },
        { delay: 500, x: 0.5, y: 0.2, type: 'heart' },
        { delay: 1000, x: 0.25, y: 0.4, type: 'ring' },
        { delay: 1000, x: 0.75, y: 0.4, type: 'ring' }
    ],
    
    celebration: [
        { delay: 0, x: 0.5, y: 0.3, type: 'heart' },
        { delay: 400, x: 0.3, y: 0.25, type: 'star' },
        { delay: 400, x: 0.7, y: 0.25, type: 'star' },
        { delay: 800, x: 0.2, y: 0.35, type: 'chrysanthemum' },
        { delay: 800, x: 0.8, y: 0.35, type: 'chrysanthemum' },
        { delay: 1200, x: 0.5, y: 0.2, type: 'ring' }
    ]
};

let currentShow = null;
let showTimeouts = [];

function playPresetShow(showName) {
    // Stop any running show
    stopPresetShow();
    
    const show = presetShows[showName];
    if (!show) return;
    
    currentShow = showName;
    
    show.forEach(event => {
        const timeout = setTimeout(() => {
            const x = event.x * canvas.width;
            const y = event.y * canvas.height;
            
            // Temporarily set explosion type
            const originalType = selectedExplosionType;
            selectedExplosionType = event.type;
            launchFirework(x, y);
            selectedExplosionType = originalType;
        }, event.delay);
        
        showTimeouts.push(timeout);
    });
    
    // Clear show after completion
    const maxDelay = Math.max(...show.map(e => e.delay)) + 3000;
    const clearTimeout = setTimeout(() => {
        currentShow = null;
        showTimeouts = [];
    }, maxDelay);
    showTimeouts.push(clearTimeout);
}

function stopPresetShow() {
    showTimeouts.forEach(timeout => clearTimeout(timeout));
    showTimeouts = [];
    currentShow = null;
}

// Adjust for mobile
if (config.isMobile) {
    config.particleCount = 60;
    config.particleSize = 2;
}

// Explosion shapes and types
const explosionShapes = {
    sphere: (count) => {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            particles.push({
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
        }
        return particles;
    },
    
    star: (count) => {
        const particles = [];
        const points = 5;
        const particlesPerPoint = Math.floor(count / points);
        
        for (let p = 0; p < points; p++) {
            const angle = (p / points) * Math.PI * 2 - Math.PI / 2;
            for (let i = 0; i < particlesPerPoint; i++) {
                const spread = (Math.random() - 0.5) * 0.4;
                const speed = Math.random() * 4 + 3;
                particles.push({
                    vx: Math.cos(angle + spread) * speed,
                    vy: Math.sin(angle + spread) * speed
                });
            }
        }
        return particles;
    },
    
    heart: (count) => {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            
            const speed = 0.3 + Math.random() * 0.2;
            particles.push({
                vx: x * speed,
                vy: y * speed
            });
        }
        return particles;
    },
    
    ring: (count) => {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 4 + Math.random() * 1;
            particles.push({
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
        }
        return particles;
    }
};

const explosionTypes = {
    standard: { shape: 'sphere', colors: 1, trail: false },
    willow: { shape: 'sphere', colors: 1, trail: true, gravity: 0.08 },
    chrysanthemum: { shape: 'sphere', colors: 3, trail: true },
    palm: { shape: 'sphere', colors: 2, trail: true, gravity: 0.12 },
    star: { shape: 'star', colors: 1, trail: false },
    heart: { shape: 'heart', colors: 1, trail: false },
    ring: { shape: 'ring', colors: 2, trail: false }
};

// Arrays to hold active fireworks and particles
const fireworks = [];
const particles = [];

// Background elements
const stars = [];
const cityBuildings = [];

// Initialize stars for starry background
function initStars() {
    stars.length = 0;
    const starCount = config.isMobile ? 100 : 200;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.7,
            size: Math.random() * 2,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

// Initialize city skyline
function initCity() {
    cityBuildings.length = 0;
    let x = 0;
    
    // Keep adding buildings until we fill the entire width
    while (x < canvas.width) {
        const width = Math.random() * 80 + 60;
        const height = Math.random() * 250 + 150;
        const windows = [];
        
        // Add windows
        const windowRows = Math.floor(height / 20);
        const windowCols = Math.floor(width / 15);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.3) { // 70% chance of lit window
                    windows.push({
                        x: col * 15 + 5,
                        y: row * 20 + 5,
                        lit: Math.random() > 0.1
                    });
                }
            }
        }
        
        cityBuildings.push({
            x: x,
            y: canvas.height - height,
            width: width,
            height: height,
            windows: windows
        });
        
        x += width + (Math.random() * 10 + 5); // Smaller gaps between buildings
    }
}

// Draw background based on config
function drawBackground() {
    if (config.background === 'starry') {
        // Draw stars
        ctx.fillStyle = '#ffffff';
        for (const star of stars) {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0) {
                star.twinkleSpeed *= -1;
            }
            
            ctx.globalAlpha = Math.abs(star.brightness) * 0.8;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    } else if (config.background === 'city') {
        // Draw city skyline
        for (const building of cityBuildings) {
            // Building silhouette
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Windows
            for (const window of building.windows) {
                if (window.lit) {
                    ctx.fillStyle = Math.random() > 0.95 ? '#ffff99' : '#ffcc66';
                    ctx.fillRect(
                        building.x + window.x,
                        building.y + window.y,
                        8, 12
                    );
                }
            }
        }
    }
}

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    config.isMobile = window.innerWidth < 768;
    
    // Reinitialize backgrounds
    if (config.background === 'starry') {
        initStars();
    } else if (config.background === 'city') {
        initCity();
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Audio Context for sound synthesis
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
    const normalizedX = (x / canvas.width) * 2 - 1; // -1 to 1
    panner.pan.value = Math.max(-1, Math.min(1, normalizedX));
    return panner;
}

// Calculate distance-based volume
function getDistanceVolume(x, y) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    const maxDistance = Math.hypot(canvas.width / 2, canvas.height / 2);
    const normalizedDistance = distance / maxDistance;
    return 1 - (normalizedDistance * 0.5); // 50% to 100% volume based on distance
}

// Firework class - the rocket that launches
class Firework {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Calculate velocity to reach target
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const distance = Math.hypot(targetX - startX, targetY - startY);
        const speed = 8;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.distanceToTarget = distance;
        this.distanceTraveled = 0;
        this.trail = [];
        this.trailLength = 10;
        this.color = '#fff';
        
        // Play launch sound
        this.playLaunchSound();
    }
    
    playLaunchSound() {
        if (!audioContext) return;
        
        const preset = audioPresets[audioConfig.preset];
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const panner = createPanner(this.x);
        const distanceVolume = getDistanceVolume(this.x, this.y);
        
        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(masterGain);
        
        // Rising pitch for whoosh effect
        oscillator.frequency.setValueAtTime(preset.launchFreqStart, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(preset.launchFreqEnd, audioContext.currentTime + preset.launchDuration);
        
        // Volume envelope with distance
        const baseVolume = 0.1 * distanceVolume;
        gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + preset.launchDuration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + preset.launchDuration);
    }
    
    update() {
        // Store trail positions
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Calculate distance traveled
        this.distanceTraveled = Math.hypot(this.x - this.startX, this.y - this.startY);
        
        // Check if reached target (90% of distance)
        return this.distanceTraveled >= this.distanceToTarget * 0.9;
    }
    
    draw() {
        ctx.beginPath();
        
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(point.x, point.y, 2, 2);
        }
        
        // Draw rocket
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle class - explosion particles
class Particle {
    constructor(x, y, color, vx, vy, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.startColor = color;
        
        this.vx = vx;
        this.vy = vy;
        
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * config.particleSize + 1;
        
        // Enhanced features
        this.hasTrail = options.trail || false;
        this.trail = [];
        this.trailLength = 8;
        this.customGravity = options.gravity || config.gravity;
        this.twinkle = Math.random() > 0.7; // 30% chance to twinkle
        this.twinkleSpeed = Math.random() * 0.1 + 0.05;
        this.twinklePhase = Math.random() * Math.PI * 2;
        
        // Color transition
        this.colorTransition = options.colorTransition || false;
        this.targetColor = this.getTargetColor();
        this.colorProgress = 0;
    }
    
    getTargetColor() {
        const colors = ['#ffaa00', '#ff6600', '#ff0000', '#ffffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    interpolateColor(progress) {
        const start = this.hexToRgb(this.startColor);
        const end = this.hexToRgb(this.targetColor);
        
        const r = Math.round(start.r + (end.r - start.r) * progress);
        const g = Math.round(start.g + (end.g - start.g) * progress);
        const b = Math.round(start.b + (end.b - start.b) * progress);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    update() {
        // Store trail
        if (this.hasTrail) {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
        }
        
        // Apply physics
        this.vx *= config.friction;
        this.vy *= config.friction;
        this.vy += this.customGravity;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Fade out
        this.alpha -= this.decay;
        
        // Color transition
        if (this.colorTransition && this.colorProgress < 1) {
            this.colorProgress += 0.02;
            this.color = this.interpolateColor(this.colorProgress);
        }
        
        // Twinkle phase
        if (this.twinkle) {
            this.twinklePhase += this.twinkleSpeed;
        }
        
        return this.alpha <= 0;
    }
    
    draw() {
        ctx.save();
        
        // Draw trail
        if (this.hasTrail && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const point = this.trail[i];
                const nextPoint = this.trail[i + 1];
                const trailAlpha = (i / this.trail.length) * point.alpha * 0.5;
                
                ctx.globalAlpha = trailAlpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size * 0.5;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
            }
        }
        
        // Calculate twinkle effect
        let drawAlpha = this.alpha;
        if (this.twinkle) {
            const twinkleMultiplier = 0.5 + Math.sin(this.twinklePhase) * 0.5;
            drawAlpha *= twinkleMultiplier;
        }
        
        ctx.globalAlpha = drawAlpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect for brighter particles
        if (this.alpha > 0.7) {
            ctx.globalAlpha = drawAlpha * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Create explosion at position
function createExplosion(x, y, type = null) {
    // Play explosion sound
    playExplosionSound(x, y);
    
    // Random explosion type if not specified
    if (!type) {
        const types = Object.keys(explosionTypes);
        type = types[Math.floor(Math.random() * types.length)];
    }
    
    const explosionConfig = explosionTypes[type];
    const shape = explosionShapes[explosionConfig.shape];
    const velocities = shape(config.particleCount);
    
    // Get colors
    const colors = [];
    for (let i = 0; i < explosionConfig.colors; i++) {
        colors.push(config.colors[Math.floor(Math.random() * config.colors.length)]);
    }
    
    // Create particles with shape-based velocities
    for (let i = 0; i < velocities.length; i++) {
        const vel = velocities[i];
        const color = colors[i % colors.length];
        const options = {
            trail: explosionConfig.trail,
            gravity: explosionConfig.gravity,
            colorTransition: explosionConfig.colors > 1
        };
        
        particles.push(new Particle(x, y, color, vel.vx, vel.vy, options));
    }
}

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
    
    // Audio routing: noise -> filter -> split to dry and reverb
    noise.connect(filter);
    
    // Dry signal
    filter.connect(dryGain);
    dryGain.connect(gainNode);
    
    // Reverb signal
    filter.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(gainNode);
    
    // Pan and connect to master
    gainNode.connect(panner);
    panner.connect(masterGain);
    
    // Reverb mix
    dryGain.gain.value = 1 - preset.reverbAmount;
    reverbGain.gain.value = preset.reverbAmount;
    
    // Filter settings with variation
    filter.type = 'lowpass';
    const startFreq = 2000 + (variation * 500);
    const endFreq = 100 + (variation * 50);
    filter.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + 0.3);
    
    // Volume envelope for boom with distance
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
            
            // Random high-pitched pop
            const freq = Math.random() * 2000 + 3000;
            oscillator.frequency.value = freq;
            oscillator.type = 'square';
            
            // Very short burst
            const volume = (Math.random() * 0.05 + 0.02) * intensity * distanceVolume;
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        }, Math.random() * 200 + 50);
    }
}

// Launch a firework
function launchFirework(targetX, targetY) {
    initAudio();
    const startX = canvas.width / 2;
    const startY = canvas.height;
    fireworks.push(new Firework(startX, startY, targetX, targetY));
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Create trailing effect instead of clearing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background elements
    drawBackground();
    
    // Use additive blending for glow effect
    ctx.globalCompositeOperation = 'lighter';
    
    // Update and draw fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        firework.draw();
        
        if (firework.update()) {
            // Firework reached target - create explosion
            createExplosion(firework.x, firework.y);
            fireworks.splice(i, 1);
        }
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.draw();
        
        if (particle.update()) {
            // Particle faded out - remove it
            particles.splice(i, 1);
        }
    }
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
}

// User interaction
canvas.addEventListener('click', (e) => {
    launchFirework(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    launchFirework(touch.clientX, touch.clientY);
});

// Auto launch feature
let autoLaunchInterval;
const autoLaunchBtn = document.getElementById('autoLaunch');

autoLaunchBtn.addEventListener('click', () => {
    if (autoLaunchInterval) {
        clearInterval(autoLaunchInterval);
        autoLaunchInterval = null;
        autoLaunchBtn.classList.remove('active');
        autoLaunchBtn.textContent = 'Auto Launch';
    } else {
        autoLaunchInterval = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.5;
            launchFirework(x, y);
        }, 800);
        autoLaunchBtn.classList.add('active');
        autoLaunchBtn.textContent = 'Stop Auto Launch';
    }
});

// Settings panel controls
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
const shareToggle = document.getElementById('shareToggle');
const sharePanel = document.getElementById('sharePanel');
const shareClose = document.getElementById('shareClose');
const panelBackdrop = document.getElementById('panelBackdrop');
const bgOptions = document.querySelectorAll('.bg-option');
const explosionTypeSelect = document.getElementById('explosionType');

let selectedExplosionType = 'random';

function closePanels() {
    settingsPanel.classList.add('hidden');
    sharePanel.classList.add('hidden');
    panelBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
}

function openPanel(panel) {
    closePanels();
    panel.classList.remove('hidden');
    panelBackdrop.classList.remove('hidden');
    
    // Prevent body scroll on mobile when panel is open
    if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
    }
    
    // Scroll panel to top
    panel.scrollTop = 0;
}

settingsToggle.addEventListener('click', () => {
    if (settingsPanel.classList.contains('hidden')) {
        openPanel(settingsPanel);
    } else {
        closePanels();
    }
});

settingsClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanels();
});

shareToggle.addEventListener('click', () => {
    if (sharePanel.classList.contains('hidden')) {
        openPanel(sharePanel);
    } else {
        closePanels();
    }
});

shareClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanels();
});

panelBackdrop.addEventListener('click', () => {
    closePanels();
});

// Background selection
bgOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        bgOptions.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        config.background = btn.dataset.bg;
        
        if (config.background === 'starry') {
            initStars();
        } else if (config.background === 'city') {
            initCity();
        }
    });
});

// Explosion type selection
explosionTypeSelect.addEventListener('change', (e) => {
    selectedExplosionType = e.target.value;
});

// Volume control
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audioConfig.volume = volume;
    volumeValue.textContent = e.target.value + '%';
    
    if (masterGain) {
        masterGain.gain.value = volume;
    }
});

// Audio preset selection
const audioPresetSelect = document.getElementById('audioPreset');

audioPresetSelect.addEventListener('change', (e) => {
    audioConfig.preset = e.target.value;
});

// Update createExplosion calls to use selected type
const originalCreateExplosion = createExplosion;
createExplosion = function(x, y) {
    const type = selectedExplosionType === 'random' ? null : selectedExplosionType;
    originalCreateExplosion(x, y, type);
};

// Share panel controls
const captureBtn = document.getElementById('captureBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const qrCodeBtn = document.getElementById('qrCodeBtn');
const shareBtn = document.getElementById('shareBtn');
const showButtons = document.querySelectorAll('.show-btn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const configNameInput = document.getElementById('configName');
const savedConfigsList = document.getElementById('savedConfigsList');
const shareMessage = document.getElementById('shareMessage');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const qrCanvas = document.getElementById('qrCanvas');

function showShareMessage(message, isSuccess = true) {
    shareMessage.textContent = message;
    shareMessage.className = `share-message ${isSuccess ? 'success' : 'error'}`;
    shareMessage.classList.remove('hidden');
    setTimeout(() => {
        shareMessage.classList.add('hidden');
    }, 3000);
}

// Screenshot capture
captureBtn.addEventListener('click', () => {
    if (captureScreenshot()) {
        showShareMessage('Screenshot saved! 📸');
    } else {
        showShareMessage('Screenshot failed', false);
    }
});

// Copy share link
copyLinkBtn.addEventListener('click', async () => {
    const url = generateShareURL();
    try {
        await navigator.clipboard.writeText(url);
        showShareMessage('Link copied to clipboard! 🔗');
    } catch (e) {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showShareMessage('Link copied! 🔗');
    }
});

// QR Code generation
qrCodeBtn.addEventListener('click', () => {
    const isHidden = qrCodeContainer.classList.contains('hidden');
    
    if (isHidden) {
        const url = generateShareURL();
        generateQRCode(url);
        qrCodeContainer.classList.remove('hidden');
        qrCodeBtn.textContent = '❌ Hide QR Code';
    } else {
        qrCodeContainer.classList.add('hidden');
        qrCodeBtn.textContent = '📱 Show QR Code';
    }
});

function generateQRCode(url) {
    // Use QR Server API for simple QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    const ctx = qrCanvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        ctx.drawImage(img, 0, 0, 200, 200);
    };
    
    img.onerror = () => {
        // Fallback: draw a simple pattern
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 100, 90);
        ctx.fillText('Generation', 100, 110);
        ctx.fillText('Failed', 100, 130);
    };
    
    img.src = qrUrl;
}

// Share button
shareBtn.addEventListener('click', async () => {
    const url = generateShareURL();
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Kaaro Fireworks',
                text: 'Check out my custom fireworks display!',
                url: url
            });
            showShareMessage('Shared successfully! 📱');
        } catch (e) {
            if (e.name !== 'AbortError') {
                showShareMessage('Share cancelled', false);
            }
        }
    } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(url);
        showShareMessage('Link copied! (Share not supported) 🔗');
    }
});

// Preset shows
showButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const showName = btn.dataset.show;
        
        // Remove playing class from all buttons
        showButtons.forEach(b => b.classList.remove('playing'));
        
        if (currentShow === showName) {
            stopPresetShow();
        } else {
            btn.classList.add('playing');
            playPresetShow(showName);
            showShareMessage(`Playing ${showName} show! 🎆`);
            
            // Remove playing class after show completes
            setTimeout(() => {
                btn.classList.remove('playing');
            }, 3000);
        }
    });
});

// Save configuration
saveConfigBtn.addEventListener('click', () => {
    const name = configNameInput.value.trim();
    if (!name) {
        showShareMessage('Please enter a name', false);
        return;
    }
    
    saveConfiguration(name);
    configNameInput.value = '';
    updateSavedConfigsList();
    showShareMessage(`Configuration "${name}" saved! 💾`);
});

// Update saved configs list
function updateSavedConfigsList() {
    const configs = getSavedConfigurations();
    const configNames = Object.keys(configs).sort((a, b) => 
        configs[b].timestamp - configs[a].timestamp
    );
    
    if (configNames.length === 0) {
        savedConfigsList.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; padding: 8px;">No saved configurations</div>';
        return;
    }
    
    savedConfigsList.innerHTML = configNames.map(name => `
        <div class="saved-config-item">
            <span class="saved-config-name" data-name="${name}">${name}</span>
            <span class="saved-config-delete" data-name="${name}">×</span>
        </div>
    `).join('');
    
    // Add click handlers
    savedConfigsList.querySelectorAll('.saved-config-name').forEach(el => {
        el.addEventListener('click', () => {
            const name = el.dataset.name;
            if (loadConfiguration(name)) {
                showShareMessage(`Loaded "${name}"! ✅`);
            }
        });
    });
    
    savedConfigsList.querySelectorAll('.saved-config-delete').forEach(el => {
        el.addEventListener('click', () => {
            const name = el.dataset.name;
            deleteConfiguration(name);
            updateSavedConfigsList();
            showShareMessage(`Deleted "${name}"`, false);
        });
    });
}

// Update UI from config
function updateUIFromConfig() {
    // Update background buttons
    bgOptions.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === config.background);
    });
    
    // Update explosion type
    explosionTypeSelect.value = selectedExplosionType;
    
    // Update audio preset
    document.getElementById('audioPreset').value = audioConfig.preset;
    
    // Update volume
    volumeSlider.value = audioConfig.volume * 100;
    volumeValue.textContent = Math.round(audioConfig.volume * 100) + '%';
    
    if (masterGain) {
        masterGain.gain.value = audioConfig.volume;
    }
    
    // Reinitialize background
    if (config.background === 'starry') {
        initStars();
    } else if (config.background === 'city') {
        initCity();
    }
}

// Load config from URL on startup
const urlConfig = getConfigFromURL();
if (urlConfig) {
    updateUIFromConfig();
}

// Initialize saved configs list
updateSavedConfigsList();

// Initialize backgrounds
if (config.background === 'starry') {
    initStars();
} else if (config.background === 'city') {
    initCity();
}

// Start animation
animate();

// Launch initial firework after a short delay
setTimeout(() => {
    launchFirework(canvas.width / 2, canvas.height / 3);
}, 500);
