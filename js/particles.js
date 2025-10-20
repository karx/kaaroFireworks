// Particles module
// Handles particle class and particle pool

// Particle class - explosion particles
class Particle {
    constructor(x, y, color, vx, vy, options = {}) {
        this.init(x, y, color, vx, vy, options);
    }
    
    init(x, y, color, vx, vy, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.startColor = color;
        
        this.vx = vx;
        this.vy = vy;
        
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * window.config.particleSize + 1;
        
        // Enhanced features
        this.hasTrail = options.trail || false;
        this.trail = [];
        this.trailLength = window.performanceConfig.reducedMotion ? 3 : 8;
        this.customGravity = options.gravity || window.config.gravity;
        this.twinkle = !window.performanceConfig.reducedMotion && Math.random() > 0.7;
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
        this.vx *= window.config.friction;
        this.vy *= window.config.friction;
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
        const ctx = window.ctx;
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

// Create particle pool (initialized after Particle class is defined)
const particlePool = new window.ObjectPool(
    () => new Particle(0, 0, '#ffffff', 0, 0),
    (particle) => {
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.alpha = 1;
        particle.trail = [];
    },
    200
);

// Export to global scope
window.Particle = Particle;
window.particlePool = particlePool;
