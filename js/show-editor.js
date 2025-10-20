// Show Editor module
// Handles timeline-based show sequencer

// Show class - represents a fireworks show
class Show {
    constructor(metadata = {}, settings = {}, timeline = []) {
        this.version = "2.2";
        this.metadata = {
            name: metadata.name || "Untitled Show",
            author: metadata.author || "User",
            duration: metadata.duration || 60000,
            created: metadata.created || new Date().toISOString(),
            modified: new Date().toISOString(),
            description: metadata.description || ""
        };
        this.settings = {
            background: settings.background || (window.config ? window.config.background : 'starry'),
            audioPreset: settings.audioPreset || (window.audioConfig ? window.audioConfig.preset : 'realistic'),
            volume: settings.volume !== undefined ? settings.volume : (window.audioConfig ? window.audioConfig.volume : 0.7),
            loop: settings.loop || false,
            loopCount: settings.loopCount || 1
        };
        this.timeline = timeline;
    }
    
    addEvent(event) {
        event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.timeline.push(event);
        this.timeline.sort((a, b) => a.time - b.time);
        this.updateDuration();
        return event.id;
    }
    
    removeEvent(eventId) {
        const index = this.timeline.findIndex(e => e.id === eventId);
        if (index > -1) {
            this.timeline.splice(index, 1);
            this.updateDuration();
            return true;
        }
        return false;
    }
    
    updateEvent(eventId, updates) {
        const event = this.timeline.find(e => e.id === eventId);
        if (event) {
            Object.assign(event, updates);
            this.timeline.sort((a, b) => a.time - b.time);
            this.updateDuration();
            return true;
        }
        return false;
    }
    
    updateDuration() {
        if (this.timeline.length > 0) {
            const lastEvent = this.timeline[this.timeline.length - 1];
            const eventDuration = lastEvent.type === 'finale' ? (lastEvent.config.duration || 5) * 1000 : 3000;
            this.metadata.duration = lastEvent.time + eventDuration;
        } else {
            this.metadata.duration = 0;
        }
    }
    
    export() {
        return JSON.stringify(this, null, 2);
    }
    
    static import(json) {
        try {
            const data = JSON.parse(json);
            return new Show(data.metadata, data.settings, data.timeline);
        } catch (e) {
            console.error('Failed to import show:', e);
            return null;
        }
    }
}

// Timeline Player - handles show playback
class TimelinePlayer {
    constructor(show) {
        this.show = show;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.startTime = 0;
        this.pauseTime = 0;
        this.eventQueue = [];
        this.executedEvents = new Set();
        this.loopIteration = 0;
    }
    
    start() {
        if (this.isPlaying && !this.isPaused) return;
        
        if (this.isPaused) {
            // Resume from pause
            this.startTime = Date.now() - this.pauseTime;
            this.isPaused = false;
        } else {
            // Start from beginning
            this.startTime = Date.now();
            this.currentTime = 0;
            this.executedEvents.clear();
            this.loopIteration = 0;
        }
        
        this.isPlaying = true;
        this.update();
    }
    
    pause() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.isPaused = true;
        this.pauseTime = this.currentTime;
    }
    
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.executedEvents.clear();
        this.loopIteration = 0;
    }
    
    seek(time) {
        this.currentTime = Math.max(0, Math.min(time, this.show.metadata.duration));
        this.startTime = Date.now() - this.currentTime;
        this.executedEvents.clear();
        
        // Mark all events before current time as executed
        this.show.timeline.forEach(event => {
            if (event.time < this.currentTime) {
                this.executedEvents.add(event.id);
            }
        });
    }
    
    update() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.currentTime = Date.now() - this.startTime;
        
        // Check for events to execute
        this.show.timeline.forEach(event => {
            if (event.time <= this.currentTime && !this.executedEvents.has(event.id)) {
                this.executeEvent(event);
                this.executedEvents.add(event.id);
            }
        });
        
        // Check if show is complete
        if (this.currentTime >= this.show.metadata.duration) {
            if (this.show.settings.loop && this.loopIteration < this.show.settings.loopCount - 1) {
                this.loopIteration++;
                this.seek(0);
                this.start();
            } else {
                this.stop();
            }
        }
        
        if (this.isPlaying) {
            requestAnimationFrame(() => this.update());
        }
    }
    
    executeEvent(event) {
        const canvas = window.canvas;
        
        switch (event.type) {
            case 'firework':
                const x = event.config.x * canvas.width;
                const y = event.config.y * canvas.height;
                const originalType = window.selectedExplosionType;
                window.selectedExplosionType = event.config.explosionType || 'random';
                window.launchFirework(x, y);
                window.selectedExplosionType = originalType;
                break;
                
            case 'burst':
                this.executeBurst(event);
                break;
                
            case 'finale':
                this.executeFinale(event);
                break;
        }
    }
    
    executeBurst(event) {
        const canvas = window.canvas;
        const count = event.config.count || 5;
        const spread = event.config.spread || 0.3;
        const centerX = 0.5;
        const centerY = 0.5;
        
        for (let i = 0; i < count; i++) {
            const x = (centerX + (Math.random() - 0.5) * spread) * canvas.width;
            const y = (centerY + (Math.random() - 0.5) * spread * 0.5) * canvas.height;
            
            setTimeout(() => {
                const originalType = window.selectedExplosionType;
                window.selectedExplosionType = event.config.explosionType || 'random';
                window.launchFirework(x, y);
                window.selectedExplosionType = originalType;
            }, i * 100);
        }
    }
    
    executeFinale(event) {
        const duration = (event.config.duration || 5) * 1000;
        const intensity = event.config.intensity || 'medium';
        const pattern = event.config.pattern || 'random';
        
        const intensityConfig = {
            low: { fireworksPerSecond: 5, particleMultiplier: 0.8 },
            medium: { fireworksPerSecond: 10, particleMultiplier: 1.0 },
            high: { fireworksPerSecond: 20, particleMultiplier: 1.2 },
            extreme: { fireworksPerSecond: 30, particleMultiplier: 1.5 }
        };
        
        const config = intensityConfig[intensity];
        const interval = 1000 / config.fireworksPerSecond;
        const count = Math.floor(duration / interval);
        
        // Temporarily increase particle count
        const originalParticleCount = window.config.particleCount;
        window.config.particleCount = Math.floor(originalParticleCount * config.particleMultiplier);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const pos = this.getFinalePosition(i, count, pattern);
                window.launchFirework(pos.x, pos.y);
            }, i * interval);
        }
        
        // Restore particle count after finale
        setTimeout(() => {
            window.config.particleCount = originalParticleCount;
        }, duration);
    }
    
    getFinalePosition(index, total, pattern) {
        const canvas = window.canvas;
        
        switch (pattern) {
            case 'cascade':
                return {
                    x: (index / total) * canvas.width,
                    y: canvas.height * (0.2 + Math.random() * 0.3)
                };
                
            case 'symmetrical':
                const side = index % 2;
                return {
                    x: side === 0 ? canvas.width * 0.25 : canvas.width * 0.75,
                    y: canvas.height * (0.2 + Math.random() * 0.4)
                };
                
            case 'spiral':
                const angle = (index / total) * Math.PI * 4;
                const radius = (index / total) * 0.3;
                return {
                    x: canvas.width * (0.5 + Math.cos(angle) * radius),
                    y: canvas.height * (0.4 + Math.sin(angle) * radius * 0.5)
                };
                
            default: // random
                return {
                    x: Math.random() * canvas.width,
                    y: canvas.height * (0.2 + Math.random() * 0.4)
                };
        }
    }
}

// Show Editor - UI for creating shows
class ShowEditor {
    constructor() {
        this.show = new Show();
        this.player = new TimelinePlayer(this.show);
        this.selectedEvent = null;
        this.zoom = 1;
        this.timelineCanvas = document.getElementById('timelineCanvas');
        this.timelineCtx = this.timelineCanvas ? this.timelineCanvas.getContext('2d') : null;
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Show name
        const showNameInput = document.getElementById('showName');
        if (showNameInput) {
            showNameInput.value = this.show.metadata.name;
            showNameInput.addEventListener('input', (e) => {
                this.show.metadata.name = e.target.value;
            });
        }
        
        // Playback controls
        document.getElementById('playShow')?.addEventListener('click', () => this.play());
        document.getElementById('pauseShow')?.addEventListener('click', () => this.pause());
        document.getElementById('stopShow')?.addEventListener('click', () => this.stop());
        document.getElementById('resetShow')?.addEventListener('click', () => this.reset());
        
        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
        
        // Event controls
        document.getElementById('addEvent')?.addEventListener('click', () => this.addEvent('firework'));
        document.getElementById('addBurst')?.addEventListener('click', () => this.addEvent('burst'));
        document.getElementById('addFinale')?.addEventListener('click', () => this.addEvent('finale'));
        document.getElementById('deleteEvent')?.addEventListener('click', () => this.deleteSelectedEvent());
        
        // Timeline canvas interaction
        if (this.timelineCanvas) {
            this.timelineCanvas.addEventListener('click', (e) => this.handleTimelineClick(e));
        }
        
        // Show actions
        document.getElementById('saveShow')?.addEventListener('click', () => this.saveShow());
        document.getElementById('loadShow')?.addEventListener('click', () => this.loadShow());
        document.getElementById('exportShow')?.addEventListener('click', () => this.exportShow());
        document.getElementById('importShow')?.addEventListener('click', () => this.importShow());
        document.getElementById('showGallery')?.addEventListener('click', () => this.openGallery());
        
        // Loop settings
        const loopCheckbox = document.getElementById('showLoop');
        if (loopCheckbox) {
            loopCheckbox.addEventListener('change', (e) => {
                this.show.settings.loop = e.target.checked;
                document.getElementById('loopCountGroup').style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        document.getElementById('loopCount')?.addEventListener('input', (e) => {
            this.show.settings.loopCount = parseInt(e.target.value) || 1;
        });
        
        this.renderTimeline();
    }
    
    play() {
        this.player.start();
        const playBtn = document.getElementById('playShow');
        const pauseBtn = document.getElementById('pauseShow');
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        this.updatePlaybackUI();
    }
    
    pause() {
        this.player.pause();
        const playBtn = document.getElementById('playShow');
        const pauseBtn = document.getElementById('pauseShow');
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }
    
    stop() {
        this.player.stop();
        const playBtn = document.getElementById('playShow');
        const pauseBtn = document.getElementById('pauseShow');
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        this.updatePlaybackUI();
    }
    
    reset() {
        this.player.seek(0);
        this.updatePlaybackUI();
    }
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.5, 10);
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${this.zoom.toFixed(1)}x`;
        this.renderTimeline();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.5, 0.5);
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${this.zoom.toFixed(1)}x`;
        this.renderTimeline();
    }
    
    addEvent(type) {
        const event = {
            time: this.player.currentTime || 0,
            type: type,
            config: this.getDefaultEventConfig(type)
        };
        
        this.show.addEvent(event);
        this.renderTimeline();
        this.updateDurationDisplay();
    }
    
    getDefaultEventConfig(type) {
        switch (type) {
            case 'firework':
                return { x: 0.5, y: 0.8, explosionType: 'random' };
            case 'burst':
                return { count: 5, spread: 0.3, explosionType: 'random' };
            case 'finale':
                return { duration: 5, intensity: 'medium', pattern: 'random' };
            default:
                return {};
        }
    }
    
    deleteSelectedEvent() {
        if (this.selectedEvent) {
            this.show.removeEvent(this.selectedEvent);
            this.selectedEvent = null;
            this.renderTimeline();
            this.updateDurationDisplay();
        }
    }
    
    handleTimelineClick(e) {
        const rect = this.timelineCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / this.timelineCanvas.width) * (this.show.metadata.duration / this.zoom);
        
        // Check if clicked on an event
        const clickedEvent = this.show.timeline.find(event => {
            const eventX = (event.time / this.show.metadata.duration) * this.timelineCanvas.width * this.zoom;
            return Math.abs(eventX - x) < 10;
        });
        
        if (clickedEvent) {
            this.selectEvent(clickedEvent.id);
        } else {
            this.player.seek(time);
        }
        
        this.renderTimeline();
    }
    
    selectEvent(eventId) {
        this.selectedEvent = eventId;
        const event = this.show.timeline.find(e => e.id === eventId);
        if (event) {
            this.populateEventProperties(event);
        }
        const deleteBtn = document.getElementById('deleteEvent');
        if (deleteBtn) deleteBtn.disabled = false;
    }
    
    populateEventProperties(event) {
        // Populate event property inputs based on event type
        const eventTime = document.getElementById('eventTime');
        const eventType = document.getElementById('eventType');
        
        if (eventTime) eventTime.value = (event.time / 1000).toFixed(1);
        if (eventType) eventType.value = event.type;
        
        // Show/hide type-specific properties
        const fireworkProps = document.getElementById('fireworkProperties');
        const burstProps = document.getElementById('burstProperties');
        const finaleProps = document.getElementById('finaleProperties');
        
        if (fireworkProps) fireworkProps.classList.toggle('hidden', event.type !== 'firework');
        if (burstProps) burstProps.classList.toggle('hidden', event.type !== 'burst');
        if (finaleProps) finaleProps.classList.toggle('hidden', event.type !== 'finale');
        
        // Enable inputs
        const eventPropsContainer = document.getElementById('eventProperties');
        if (eventPropsContainer) {
            eventPropsContainer.querySelectorAll('input, select').forEach(el => {
                el.disabled = false;
            });
        }
        
        // Populate type-specific fields
        if (event.type === 'firework') {
            const eventX = document.getElementById('eventX');
            const eventY = document.getElementById('eventY');
            const eventExplosion = document.getElementById('eventExplosion');
            
            if (eventX) eventX.value = event.config.x;
            if (eventY) eventY.value = event.config.y;
            if (eventExplosion) eventExplosion.value = event.config.explosionType;
        } else if (event.type === 'burst') {
            const burstCount = document.getElementById('burstCount');
            const burstSpread = document.getElementById('burstSpread');
            
            if (burstCount) burstCount.value = event.config.count;
            if (burstSpread) burstSpread.value = event.config.spread;
        } else if (event.type === 'finale') {
            const finaleDuration = document.getElementById('finaleDuration');
            const finaleIntensity = document.getElementById('finaleIntensity');
            const finalePattern = document.getElementById('finalePattern');
            
            if (finaleDuration) finaleDuration.value = event.config.duration;
            if (finaleIntensity) finaleIntensity.value = event.config.intensity;
            if (finalePattern) finalePattern.value = event.config.pattern;
        }
        
        const applyBtn = document.getElementById('applyEventChanges');
        if (applyBtn) applyBtn.disabled = false;
    }
    
    renderTimeline() {
        if (!this.timelineCtx || !this.timelineCanvas) {
            console.warn('Timeline canvas not available');
            return;
        }
        
        const ctx = this.timelineCtx;
        const width = this.timelineCanvas.width;
        const height = this.timelineCanvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw events
        this.show.timeline.forEach(event => {
            const x = (event.time / this.show.metadata.duration) * width * this.zoom;
            
            if (x >= 0 && x <= width) {
                ctx.fillStyle = event.id === this.selectedEvent ? '#8b5cf6' : '#6366f1';
                ctx.beginPath();
                ctx.arc(x, height / 2, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Event type indicator
                ctx.fillStyle = '#fff';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                const label = event.type === 'firework' ? '●' : event.type === 'burst' ? '💥' : '🎆';
                ctx.fillText(label, x, height / 2 - 12);
            }
        });
        
        // Draw playhead
        const playheadX = (this.player.currentTime / this.show.metadata.duration) * width * this.zoom;
        const playhead = document.getElementById('timelinePlayhead');
        if (playhead) playhead.style.left = `${playheadX}px`;
    }
    
    updatePlaybackUI() {
        const currentTime = Math.floor(this.player.currentTime / 1000);
        const totalTime = Math.floor(this.show.metadata.duration / 1000);
        
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        
        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
        if (totalTimeEl) totalTimeEl.textContent = this.formatTime(totalTime);
        
        if (this.player.isPlaying) {
            requestAnimationFrame(() => this.updatePlaybackUI());
        }
    }
    
    updateDurationDisplay() {
        const duration = Math.floor(this.show.metadata.duration / 1000);
        const durationEl = document.getElementById('showDuration');
        if (durationEl) durationEl.textContent = this.formatTime(duration);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    saveShow() {
        const name = this.show.metadata.name;
        localStorage.setItem(`fireworksShow_${name}`, this.show.export());
        alert(`Show "${name}" saved!`);
    }
    
    loadShow() {
        const name = prompt('Enter show name to load:');
        if (name) {
            const data = localStorage.getItem(`fireworksShow_${name}`);
            if (data) {
                this.show = Show.import(data);
                this.player = new TimelinePlayer(this.show);
                this.renderTimeline();
                this.updateDurationDisplay();
                const showNameInput = document.getElementById('showName');
                if (showNameInput) showNameInput.value = this.show.metadata.name;
            } else {
                alert('Show not found!');
            }
        }
    }
    
    exportShow() {
        const json = this.show.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${this.show.metadata.name}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    importShow() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                this.show = Show.import(event.target.result);
                if (this.show) {
                    this.player = new TimelinePlayer(this.show);
                    this.renderTimeline();
                    this.updateDurationDisplay();
                    const showNameInput = document.getElementById('showName');
                    if (showNameInput) showNameInput.value = this.show.metadata.name;
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    openGallery() {
        const modal = document.getElementById('showGalleryModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.populateGallery();
        }
    }
    
    populateGallery() {
        const gallery = document.getElementById('galleryGrid');
        if (!gallery) return;
        
        // Pre-made shows
        const premadeShows = [
            {
                name: "Quick Celebration",
                description: "30-second burst of joy",
                duration: 30,
                thumbnail: "🎉"
            },
            {
                name: "Grand Finale",
                description: "2-minute spectacular show",
                duration: 120,
                thumbnail: "🎆"
            },
            {
                name: "Romantic Evening",
                description: "Gentle, colorful display",
                duration: 60,
                thumbnail: "❤️"
            }
        ];
        
        gallery.innerHTML = premadeShows.map(show => `
            <div class="gallery-item" onclick="window.showEditor.loadPremadeShow('${show.name}')">
                <div class="gallery-item-thumbnail">${show.thumbnail}</div>
                <div class="gallery-item-name">${show.name}</div>
                <div class="gallery-item-description">${show.description}</div>
                <div class="gallery-item-duration">${show.duration}s</div>
            </div>
        `).join('');
    }
    
    loadPremadeShow(name) {
        // Load premade show logic here
        const modal = document.getElementById('showGalleryModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Initialize show editor when panel is opened
let showEditor = null;

function initShowEditor() {
    const showEditorToggle = document.getElementById('showEditorToggle');
    const showEditorClose = document.getElementById('showEditorClose');
    const galleryClose = document.getElementById('galleryClose');
    
    console.log('Initializing show editor...', { showEditorToggle, showEditorClose, galleryClose });
    
    if (showEditorToggle) {
        showEditorToggle.addEventListener('click', () => {
            console.log('Show editor toggle clicked');
            const panel = document.getElementById('showEditorPanel');
            if (panel && panel.classList.contains('hidden')) {
                console.log('Opening show editor panel');
                panel.classList.remove('hidden');
                if (!showEditor) {
                    console.log('Creating new ShowEditor instance');
                    try {
                        showEditor = new ShowEditor();
                        window.showEditor = showEditor;
                        console.log('ShowEditor created successfully');
                    } catch (error) {
                        console.error('Error creating ShowEditor:', error);
                    }
                }
            } else if (panel) {
                console.log('Closing show editor panel');
                panel.classList.add('hidden');
            }
        });
    } else {
        console.warn('Show editor toggle button not found');
    }
    
    if (showEditorClose) {
        showEditorClose.addEventListener('click', () => {
            const panel = document.getElementById('showEditorPanel');
            if (panel) panel.classList.add('hidden');
        });
    }
    
    if (galleryClose) {
        galleryClose.addEventListener('click', () => {
            const modal = document.getElementById('showGalleryModal');
            if (modal) modal.classList.add('hidden');
        });
    }
}

// Export to global scope
window.Show = Show;
window.TimelinePlayer = TimelinePlayer;
window.ShowEditor = ShowEditor;
window.initShowEditor = initShowEditor;
