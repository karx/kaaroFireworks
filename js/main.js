// Main module
// Handles animation loop, canvas resize, and initialization

// Resize canvas to fill window
function resizeCanvas() {
    window.canvas.width = window.innerWidth;
    window.canvas.height = window.innerHeight;
    window.config.isMobile = window.innerWidth < 768;
    
    // Reinitialize backgrounds
    if (window.config.background === 'starry') {
        window.initStars();
    } else if (window.config.background === 'city') {
        window.initCity();
    }
}

// Animation loop
function animate() {
    window.updateFPS();
    
    // Frame skipping for battery saving
    if (window.performanceConfig.batterySaving && window.performanceConfig.frameCount % 2 === 0) {
        requestAnimationFrame(animate);
        return;
    }
    
    // Trail effect based on reduced motion setting
    const trailAlpha = window.performanceConfig.reducedMotion ? 0.2 : 0.1;
    window.ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);
    
    // Draw background
    if (!window.performanceConfig.batterySaving) {
        window.drawBackground();
    }
    
    // Update and draw fireworks
    for (let i = window.fireworks.length - 1; i >= 0; i--) {
        const firework = window.fireworks[i];
        const exploded = firework.update();
        firework.draw();
        
        if (exploded) {
            window.fireworks.splice(i, 1);
            const type = window.selectedExplosionType || 'random';
            window.createExplosion(firework.x, firework.y, type);
        }
    }
    
    // Update and draw particles
    for (let i = window.particles.length - 1; i >= 0; i--) {
        const particle = window.particles[i];
        const dead = particle.update();
        particle.draw();
        
        if (dead) {
            window.particles.splice(i, 1);
            window.particlePool.release(particle);
        }
    }
    
    // Update profiler
    window.updateProfiler();
    
    requestAnimationFrame(animate);
}

// Initialize everything
function init() {
    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize backgrounds
    if (window.config.background === 'starry') {
        window.initStars();
    } else if (window.config.background === 'city') {
        window.initCity();
    }
    
    // Initialize UI
    window.initUI();
    window.initUserInteraction();
    window.loadURLConfig();
    
    // Initialize sync controls
    if (window.initSyncControls) {
        window.initSyncControls();
    }
    
    // Initialize show editor
    if (window.initShowEditor) {
        window.initShowEditor();
    }
    
    // Start animation
    animate();
    
    // Launch initial firework after a short delay
    setTimeout(() => {
        const x = window.canvas.width / 2;
        const y = window.canvas.height / 3;
        window.launchFirework(x, y);
    }, 500);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
