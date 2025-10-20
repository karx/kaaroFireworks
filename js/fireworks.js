// Fireworks module
// Handles firework class, explosions, and background rendering

// Arrays to hold active fireworks and particles
const fireworks = [];
const particles = [];

// Background elements
const stars = [];
const cityBuildings = [];

// Initialize stars for starry background
function initStars() {
    stars.length = 0;
    const starCount = window.config.isMobile ? 100 : 200;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * window.canvas.width,
            y: Math.random() * window.canvas.height * 0.7,
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
    
    while (x < window.canvas.width) {
        const width = Math.random() * 80 + 60;
        const height = Math.random() * 250 + 150;
        const windows = [];
        
        const windowRows = Math.floor(height / 20);
        const windowCols = Math.floor(width / 15);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.3) {
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
            y: window.canvas.height - height,
            width: width,
            height: height,
            windows: windows
        });
        
        x += width + (Math.random() * 10 + 5);
    }
}

// Draw background based on config
function drawBackground() {
    const ctx = window.ctx;
    const config = window.config;
    
    if (config.background === 'starry') {
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
        for (const building of cityBuildings) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
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

// Firework class - the rocket that launches
class Firework {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        
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
        
        this.playLaunchSound();
    }
    
    playLaunchSound() {
        // Use the new sample-based launch sound system
        if (window.playLaunchSound) {
            window.playLaunchSound(this.x, this.y);
        }
    }
    
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.distanceTraveled = Math.hypot(this.x - this.startX, this.y - this.startY);
        
        return this.distanceTraveled >= this.distanceToTarget * 0.9;
    }
    
    draw() {
        const ctx = window.ctx;
        ctx.beginPath();
        
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = i / this.trail.length;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(point.x, point.y, 2, 2);
        }
        
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create explosion at position
function createExplosion(x, y, style = null) {
    window.playExplosionSound(x, y);
    
    // Select random style if not specified
    if (!style || style === 'random') {
        const styles = Object.keys(window.fireworkStyles);
        style = styles[Math.floor(Math.random() * styles.length)];
    }
    
    // Get style configuration
    const styleConfig = window.fireworkStyles[style];
    const shape = window.explosionShapes[styleConfig.shape];
    
    // Adjust particle count based on performance
    let particleCount = window.config.particleCount;
    if (window.performanceConfig.batterySaving) {
        particleCount = Math.floor(particleCount * 0.5);
    } else if (window.performanceConfig.adaptiveQuality && window.performanceConfig.currentFPS < 30) {
        particleCount = Math.floor(particleCount * 0.7);
    }
    
    const velocities = shape(particleCount);
    
    // Get colors
    const colors = [];
    for (let i = 0; i < styleConfig.colors; i++) {
        colors.push(window.config.colors[Math.floor(Math.random() * window.config.colors.length)]);
    }
    
    // Create particles
    for (const velocity of velocities) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particle = window.particlePool.get();
        particle.init(x, y, color, velocity.vx, velocity.vy, {
            trail: styleConfig.trail && !window.performanceConfig.reducedMotion,
            gravity: styleConfig.gravity,
            colorTransition: styleConfig.colors > 1
        });
        particles.push(particle);
    }
}

// Launch a firework
function launchFirework(targetX, targetY) {
    const startX = Math.random() * window.canvas.width;
    const startY = window.canvas.height;
    fireworks.push(new Firework(startX, startY, targetX, targetY));
    
    // Track firework launch
    window.analytics?.trackFireworkLaunch(
        window.selectedFireworkStyle || 'random',
        window.config?.isMobile || false
    );
}

// Preset show management
let currentShow = null;
let showTimeouts = [];

function playPresetShow(showName) {
    stopPresetShow();
    
    const show = window.presetShows[showName];
    if (!show) return;
    
    currentShow = showName;
    
    show.forEach(event => {
        const timeout = setTimeout(() => {
            const x = event.x * window.canvas.width;
            const y = event.y * window.canvas.height;
            
            const originalStyle = window.selectedFireworkStyle;
            window.selectedFireworkStyle = event.type;
            launchFirework(x, y);
            window.selectedFireworkStyle = originalStyle;
        }, event.delay);
        
        showTimeouts.push(timeout);
    });
    
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

// Text explosions - spell words with fireworks
function getTextParticlePositions(text, centerX, centerY, fontSize = 100) {
    // Create temporary canvas for text measurement
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set font and measure text
    tempCtx.font = `bold ${fontSize}px Arial`;
    const metrics = tempCtx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Set canvas size
    tempCanvas.width = textWidth + 20;
    tempCanvas.height = textHeight + 20;
    
    // Draw text
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.fillStyle = 'white';
    tempCtx.textBaseline = 'top';
    tempCtx.fillText(text, 10, 10);
    
    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    
    // Sample pixels to get particle positions
    const positions = [];
    const sampleRate = 3; // Sample every 3rd pixel for performance
    
    for (let y = 0; y < tempCanvas.height; y += sampleRate) {
        for (let x = 0; x < tempCanvas.width; x += sampleRate) {
            const index = (y * tempCanvas.width + x) * 4;
            const alpha = pixels[index + 3];
            
            // If pixel is not transparent
            if (alpha > 128) {
                // Convert to world coordinates (centered)
                const worldX = centerX + (x - tempCanvas.width / 2);
                const worldY = centerY + (y - tempCanvas.height / 2);
                positions.push({ x: worldX, y: worldY });
            }
        }
    }
    
    return positions;
}

function createTextExplosion(text, centerX, centerY, options = {}) {
    const fontSize = options.fontSize || 100;
    const color = options.color || window.config.colors[Math.floor(Math.random() * window.config.colors.length)];
    const delay = options.delay || 0;
    const spread = options.spread || 1.0;
    
    setTimeout(() => {
        // Get particle positions for text
        const positions = getTextParticlePositions(text, centerX, centerY, fontSize);
        
        // Create particles at each position
        positions.forEach((pos, index) => {
            // Stagger particle creation slightly for effect
            setTimeout(() => {
                const particle = window.particlePool.get();
                
                // Small random velocity for settling effect
                const vx = (Math.random() - 0.5) * 0.5 * spread;
                const vy = (Math.random() - 0.5) * 0.5 * spread;
                
                particle.init(pos.x, pos.y, color, vx, vy, {
                    trail: false,
                    gravity: window.config.gravity * 0.3, // Less gravity for text
                    colorTransition: false
                });
                
                particles.push(particle);
            }, index * 0.5); // Stagger by 0.5ms per particle
        });
        
        // Play sound
        if (window.playExplosionSound) {
            window.playExplosionSound(centerX, centerY);
        }
    }, delay);
}

function launchTextFirework(text, targetX, targetY, options = {}) {
    // Launch a firework that explodes into text
    const startX = Math.random() * window.canvas.width;
    const startY = window.canvas.height;
    
    const firework = new Firework(startX, startY, targetX, targetY);
    fireworks.push(firework);
    
    // Override the explosion to create text instead
    const checkExplosion = setInterval(() => {
        const exploded = firework.distanceTraveled >= firework.distanceToTarget * 0.9;
        if (exploded) {
            clearInterval(checkExplosion);
            const index = fireworks.indexOf(firework);
            if (index > -1) {
                fireworks.splice(index, 1);
            }
            createTextExplosion(text, firework.x, firework.y, options);
        }
    }, 16);
}

function spellWordSequence(words, options = {}) {
    const spacing = options.spacing || 150;
    const delay = options.delay || 1000;
    const centerY = options.centerY || window.canvas.height * 0.3;
    
    // Calculate total width needed
    const totalWords = Array.isArray(words) ? words : words.split(' ');
    const startX = window.canvas.width / 2 - (totalWords.length * spacing) / 2;
    
    totalWords.forEach((word, index) => {
        const x = startX + index * spacing;
        setTimeout(() => {
            launchTextFirework(word, x, centerY, options);
        }, index * delay);
    });
}

// Image/Logo particle arrangements
function getImageParticlePositions(imageElement, centerX, centerY, maxWidth = 300) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Calculate scaled dimensions
    const aspectRatio = imageElement.width / imageElement.height;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxWidth) {
        height = maxWidth;
        width = maxWidth * aspectRatio;
    }
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Draw image
    tempCtx.drawImage(imageElement, 0, 0, width, height);
    
    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    // Sample pixels to get particle positions with colors
    const positions = [];
    const sampleRate = 3; // Sample every 3rd pixel
    
    for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
            const index = (y * width + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const alpha = pixels[index + 3];
            
            // If pixel is not transparent
            if (alpha > 128) {
                const worldX = centerX + (x - width / 2);
                const worldY = centerY + (y - height / 2);
                const color = `rgb(${r}, ${g}, ${b})`;
                positions.push({ x: worldX, y: worldY, color: color });
            }
        }
    }
    
    return positions;
}

function createImageExplosion(imageElement, centerX, centerY, options = {}) {
    const maxWidth = options.maxWidth || 300;
    const delay = options.delay || 0;
    const spread = options.spread || 1.0;
    const useImageColors = options.useImageColors !== false;
    
    setTimeout(() => {
        const positions = getImageParticlePositions(imageElement, centerX, centerY, maxWidth);
        
        positions.forEach((pos, index) => {
            setTimeout(() => {
                const particle = window.particlePool.get();
                
                const vx = (Math.random() - 0.5) * 0.5 * spread;
                const vy = (Math.random() - 0.5) * 0.5 * spread;
                
                const color = useImageColors ? pos.color : 
                    window.config.colors[Math.floor(Math.random() * window.config.colors.length)];
                
                particle.init(pos.x, pos.y, color, vx, vy, {
                    trail: false,
                    gravity: window.config.gravity * 0.3,
                    colorTransition: false
                });
                
                particles.push(particle);
            }, index * 0.5);
        });
        
        if (window.playExplosionSound) {
            window.playExplosionSound(centerX, centerY);
        }
    }, delay);
}

function launchImageFirework(imageElement, targetX, targetY, options = {}) {
    const startX = Math.random() * window.canvas.width;
    const startY = window.canvas.height;
    
    const firework = new Firework(startX, startY, targetX, targetY);
    fireworks.push(firework);
    
    const checkExplosion = setInterval(() => {
        const exploded = firework.distanceTraveled >= firework.distanceToTarget * 0.9;
        if (exploded) {
            clearInterval(checkExplosion);
            const index = fireworks.indexOf(firework);
            if (index > -1) {
                fireworks.splice(index, 1);
            }
            createImageExplosion(imageElement, firework.x, firework.y, options);
        }
    }, 16);
}

function loadImageFromFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => callback(img);
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function loadImageFromURL(url, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => callback(img);
    img.onerror = () => console.error('Failed to load image from URL');
    img.src = url;
}

// Export to global scope
window.fireworks = fireworks;
window.particles = particles;
window.stars = stars;
window.cityBuildings = cityBuildings;
window.initStars = initStars;
window.initCity = initCity;
window.drawBackground = drawBackground;
window.Firework = Firework;
window.createExplosion = createExplosion;
window.launchFirework = launchFirework;
window.currentShow = currentShow;
window.playPresetShow = playPresetShow;
window.stopPresetShow = stopPresetShow;
window.getTextParticlePositions = getTextParticlePositions;
window.createTextExplosion = createTextExplosion;
window.launchTextFirework = launchTextFirework;
window.spellWordSequence = spellWordSequence;
window.getImageParticlePositions = getImageParticlePositions;
window.createImageExplosion = createImageExplosion;
window.launchImageFirework = launchImageFirework;
window.loadImageFromFile = loadImageFromFile;
window.loadImageFromURL = loadImageFromURL;
