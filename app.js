// Canvas setup
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
    particleSize: 3
};

// Arrays to hold active fireworks and particles
const fireworks = [];
const particles = [];

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
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Random velocity in all directions
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * config.particleSize + 1;
    }
    
    update() {
        // Apply physics
        this.vx *= config.friction;
        this.vy *= config.friction;
        this.vy += config.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Fade out
        this.alpha -= this.decay;
        
        return this.alpha <= 0;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Create explosion at position
function createExplosion(x, y) {
    // Play explosion sound
    playExplosionSound();
    
    // Create particles
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle(x, y, color));
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

// Start animation
animate();

// Launch initial firework after a short delay
setTimeout(() => {
    launchFirework(canvas.width / 2, canvas.height / 3);
}, 500);
