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

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
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
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Rising pitch for whoosh effect
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.3);
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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
    playExplosionSound();
    
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

function playExplosionSound() {
    if (!audioContext) return;
    
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
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Filter settings
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
    
    // Volume envelope for boom
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.3);
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
const bgOptions = document.querySelectorAll('.bg-option');
const explosionTypeSelect = document.getElementById('explosionType');

let selectedExplosionType = 'random';

settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
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

// Update createExplosion calls to use selected type
const originalCreateExplosion = createExplosion;
createExplosion = function(x, y) {
    const type = selectedExplosionType === 'random' ? null : selectedExplosionType;
    originalCreateExplosion(x, y, type);
};

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
