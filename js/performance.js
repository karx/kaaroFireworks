// Performance optimization module
// Handles object pooling, FPS monitoring, and adaptive quality

// Detect system preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersBatterySaving = window.matchMedia('(prefers-reduced-data: reduce)').matches;

// Performance configuration
const performanceConfig = {
    targetFPS: 60,
    currentFPS: 60,
    frameCount: 0,
    lastFrameTime: window.performance.now(),
    fpsHistory: [],
    adaptiveQuality: true,
    batterySaving: prefersBatterySaving,
    reducedMotion: prefersReducedMotion,
    showProfiler: false
};

// Object pool for efficient memory management
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
    
    getActiveCount() {
        return this.active.length;
    }
    
    getPoolSize() {
        return this.pool.length;
    }
}

// FPS monitoring and adaptive quality
function updateFPS() {
    const now = window.performance.now();
    const delta = now - performanceConfig.lastFrameTime;
    performanceConfig.lastFrameTime = now;
    
    performanceConfig.frameCount++;
    const fps = 1000 / delta;
    performanceConfig.fpsHistory.push(fps);
    
    if (performanceConfig.fpsHistory.length > 60) {
        performanceConfig.fpsHistory.shift();
    }
    
    // Update FPS display every 10 frames
    if (performanceConfig.frameCount % 10 === 0) {
        const avgFPS = performanceConfig.fpsHistory.reduce((a, b) => a + b, 0) / performanceConfig.fpsHistory.length;
        performanceConfig.currentFPS = Math.round(avgFPS);
        
        // Adaptive quality adjustment
        if (performanceConfig.adaptiveQuality && window.config) {
            if (avgFPS < 30 && window.config.particleCount > 20) {
                window.config.particleCount = Math.max(20, window.config.particleCount - 5);
            } else if (avgFPS > 55 && window.config.particleCount < 100) {
                window.config.particleCount = Math.min(100, window.config.particleCount + 2);
            }
        }
    }
}

function updateProfiler() {
    if (!performanceConfig.showProfiler) return;
    
    const fpsValue = document.getElementById('fpsValue');
    const particleCount = document.getElementById('particleCount');
    const poolSize = document.getElementById('poolSize');
    const fireworkCount = document.getElementById('fireworkCount');
    
    if (fpsValue) fpsValue.textContent = performanceConfig.currentFPS;
    if (particleCount && window.particlePool) particleCount.textContent = window.particlePool.getActiveCount();
    if (poolSize && window.particlePool) poolSize.textContent = window.particlePool.getPoolSize();
    if (fireworkCount && window.fireworks) fireworkCount.textContent = window.fireworks.length;
}

// Export to global scope
window.ObjectPool = ObjectPool;
window.performanceConfig = performanceConfig;
window.updateFPS = updateFPS;
window.updateProfiler = updateProfiler;
