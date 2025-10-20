// Configuration module
// Handles global configuration, explosion types, and preset shows

// Canvas setup
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

// Global configuration
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
    background: 'starry',
    isMobile: window.innerWidth < 768
};

// Adjust for mobile
if (config.isMobile) {
    config.particleCount = 60;
    config.particleSize = 2;
}

// Explosion shapes - geometric patterns for particles
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
    },
    
    spiral: (count) => {
        const particles = [];
        const rotations = 3;
        for (let i = 0; i < count; i++) {
            const progress = i / count;
            const angle = progress * Math.PI * 2 * rotations;
            const radius = progress * 5 + 2;
            const speed = 1 + Math.random() * 0.5;
            particles.push({
                vx: Math.cos(angle) * radius * speed,
                vy: Math.sin(angle) * radius * speed
            });
        }
        return particles;
    }
};

// Firework Styles - unified system combining shape and visual effects
const fireworkStyles = {
    sphere: {
        name: 'Sphere',
        icon: '💥',
        description: 'Classic burst',
        shape: 'sphere',
        colors: 1,
        trail: false,
        gravity: 0.05
    },
    star: {
        name: 'Star',
        icon: '⭐',
        description: '5-pointed star',
        shape: 'star',
        colors: 1,
        trail: false,
        gravity: 0.05
    },
    heart: {
        name: 'Heart',
        icon: '❤️',
        description: 'Romantic heart',
        shape: 'heart',
        colors: 1,
        trail: false,
        gravity: 0.05
    },
    ring: {
        name: 'Ring',
        icon: '⭕',
        description: 'Perfect circle',
        shape: 'ring',
        colors: 2,
        trail: false,
        gravity: 0.05
    },
    willow: {
        name: 'Willow',
        icon: '🌿',
        description: 'Drooping trails',
        shape: 'sphere',
        colors: 1,
        trail: true,
        gravity: 0.08
    },
    chrysanthemum: {
        name: 'Chrysanthemum',
        icon: '🌸',
        description: 'Multi-burst',
        shape: 'sphere',
        colors: 3,
        trail: true,
        gravity: 0.05
    },
    palm: {
        name: 'Palm',
        icon: '🌴',
        description: 'Palm tree effect',
        shape: 'sphere',
        colors: 2,
        trail: true,
        gravity: 0.12
    },
    spiral: {
        name: 'Spiral',
        icon: '🌀',
        description: 'Rotating burst',
        shape: 'spiral',
        colors: 2,
        trail: true,
        gravity: 0.05
    }
};

// Legacy support - map old explosionTypes to new fireworkStyles
const explosionTypes = fireworkStyles;

// Preset shows
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

// Configuration sharing
function getConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('config')) {
        try {
            const encoded = params.get('config');
            const decoded = atob(encoded);
            return JSON.parse(decoded);
        } catch (e) {
            console.error('Invalid config URL:', e);
        }
    }
    return null;
}

function generateShareURL() {
    const shareConfig = {
        background: config.background,
        explosionType: window.selectedFireworkStyle || 'random',
        audioPreset: window.audioConfig?.preset || 'balanced',
        volume: window.audioConfig?.volume || 0.5
    };
    
    const encoded = btoa(JSON.stringify(shareConfig));
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?config=${encoded}`;
}

// Configuration storage
function saveConfiguration(name) {
    const savedConfigs = JSON.parse(localStorage.getItem('fireworksConfigs') || '{}');
    savedConfigs[name] = {
        background: config.background,
        explosionType: window.selectedFireworkStyle || 'random',
        audioPreset: window.audioConfig?.preset || 'balanced',
        volume: window.audioConfig?.volume || 0.5,
        reverbAmount: window.audioConfig?.reverbAmount !== undefined ? window.audioConfig.reverbAmount : 0.4,
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
        if (window.selectedFireworkStyle !== undefined) window.selectedFireworkStyle = cfg.explosionType;
        if (window.audioConfig) {
            window.audioConfig.preset = cfg.audioPreset;
            window.audioConfig.volume = cfg.volume;
            if (cfg.reverbAmount !== undefined) {
                window.audioConfig.reverbAmount = cfg.reverbAmount;
            }
        }
        
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
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(canvas, 0, 0);
        
        tempCtx.font = 'bold 24px Arial';
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        tempCtx.textAlign = 'right';
        tempCtx.fillText('Kaaro Fireworks', tempCanvas.width - 20, tempCanvas.height - 20);
        
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
                captureScreenshot();
            }
        }, 'image/png');
    } catch (e) {
        console.error('Share failed:', e);
        captureScreenshot();
    }
}

// Export to global scope
window.canvas = canvas;
window.ctx = ctx;
window.config = config;
window.explosionShapes = explosionShapes;
window.fireworkStyles = fireworkStyles;
window.explosionTypes = explosionTypes; // Legacy support
window.presetShows = presetShows;
window.getConfigFromURL = getConfigFromURL;
window.generateShareURL = generateShareURL;
window.saveConfiguration = saveConfiguration;
window.loadConfiguration = loadConfiguration;
window.getSavedConfigurations = getSavedConfigurations;
window.deleteConfiguration = deleteConfiguration;
window.captureScreenshot = captureScreenshot;
window.shareScreenshot = shareScreenshot;
