// Analytics module for Kaaro Fireworks
// Privacy-friendly event tracking using Plausible Analytics

// Works with the Plausible pa-*.js snippet: the inline stub in <head> defines window.plausible (a queue)
// before this file runs, so events are queued and sent once the async script loads.
// Every custom event carries a `page` prop: home | ascii | about | not_found (from <body data-page>).

function currentPage() {
    const fromBody = document.body && document.body.dataset && document.body.dataset.page;
    if (fromBody) return fromBody;
    const path = (window.location && window.location.pathname) || '/';
    if (/ascii-to-3d/.test(path)) return 'ascii';
    if (/about/.test(path)) return 'about';
    return 'home';
}

const FIREWORK_EVENT_INTERVAL_MS = 5000;   // send firework_launch at most once per 5 s

const analytics = {
    initialized: false,
    debug: false, // Set to true for console logging
    _fw: { lastSent: 0, pending: 0, props: null, timer: null },
    
    init() {
        // Check if Plausible (or its queue stub) is present
        this.initialized = typeof window.plausible === 'function';
        
        if (!this.initialized) {
            console.warn('Analytics not loaded - tracking disabled');
        } else {
            if (this.debug) console.log('Analytics initialized');
        }
        
        // Track initial page view (automatic with Plausible)
        return this.initialized;
    },
    
    track(eventName, props = {}) {
        if (!this.initialized && typeof window.plausible === 'function') this.initialized = true;   // stub defined late
        if (!this.initialized) {
            if (this.debug) console.log('Analytics track (disabled):', eventName, props);
            return;
        }
        
        try {
            window.plausible(eventName, { props: Object.assign({ page: currentPage() }, props) });
            if (this.debug) console.log('Analytics track:', eventName, props);
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    },
    
    // Firework Events
    // Rate-limited: the first launch is sent at once, later ones are batched into one event per 5 s
    // with `count` = launches it represents (so heavy tapping doesn't burn the event quota).
    trackFireworkLaunch(explosionType, isMobile) {
        const fw = this._fw;
        fw.pending += 1;
        fw.props = { explosion_type: explosionType || 'random', is_mobile: isMobile ? 'yes' : 'no' };
        const now = Date.now();
        const wait = fw.lastSent + FIREWORK_EVENT_INTERVAL_MS - now;
        if (wait <= 0) { this._flushFireworks(); return; }
        if (!fw.timer) fw.timer = setTimeout(() => this._flushFireworks(), wait);
    },
    
    _flushFireworks() {
        const fw = this._fw;
        if (fw.timer) { clearTimeout(fw.timer); fw.timer = null; }
        if (!fw.pending) return;
        this.track('firework_launch', Object.assign({}, fw.props, { count: fw.pending }));
        fw.pending = 0;
        fw.lastSent = Date.now();
    },
    
    trackAutoShowStart() {
        this.track('auto_show_start');
    },
    
    trackAutoShowStop() {
        this.track('auto_show_stop');
    },
    
    // Configuration Events
    trackBackgroundChange(backgroundType) {
        this.track('background_change', { 
            background_type: backgroundType 
        });
    },
    
    trackAudioPresetChange(preset) {
        this.track('audio_preset_change', { preset });
    },
    
    trackVolumeChange(volumeLevel) {
        // Round to nearest 10% to reduce unique values
        const rounded = Math.round(volumeLevel / 10) * 10;
        this.track('volume_change', { 
            volume_level: `${rounded}%` 
        });
    },
    
    trackExplosionTypeChange(type) {
        this.track('explosion_type_change', { type });
    },
    
    // Multi-User Events
    trackRoomCreate() {
        this.track('room_create');
    },
    
    trackRoomJoin(roomId) {
        // Don't send actual room ID for privacy
        this.track('room_join', { 
            room_id_length: roomId ? roomId.length : 0 
        });
    },
    
    trackRoomLeave() {
        this.track('room_leave');
    },
    
    trackSyncFireworkSend() {
        this.track('sync_firework_send');
    },
    
    trackSyncFireworkReceive() {
        this.track('sync_firework_receive');
    },
    
    // Sharing & Saving Events
    trackConfigSave(configName) {
        this.track('config_save', {
            name_length: configName ? configName.length : 0
        });
    },
    
    trackConfigLoad(configName) {
        this.track('config_load', {
            name_length: configName ? configName.length : 0
        });
    },
    
    // source: settings (classic Share & Save panel) | send_wishes (personalised link panel)
    // method: copy | whatsapp | native
    trackShareURLGenerate(source = 'settings', method = 'copy') {
        this.track('share_url_generate', { source, method });
    },
    
    trackShareURLCopy(source = 'settings') {
        this.track('share_url_copy', { source });
    },
    
    // Personalised links and the Diwali reel (PRs #4/#5)
    trackPersonalizedVisit(lang, hasMsg) {
        this.track('personalized_visit', { lang: lang || 'en', has_msg: hasMsg ? 'yes' : 'no' });
    },
    
    trackReel(action, from) {
        // action: open | download | send_wishes
        this.track('reel_' + action, from ? { from } : {});
    },
    
    trackReelLinkClick(placement) {
        this.track('reel_link_click', { placement: placement || 'footer' });
    },
    
    trackAsciiSkip() {
        this.track('ascii_skip_to_3d');
    },
    
    trackCTA3D() {
        this.track('cta_3d_click');
    },
    
    trackQRCodeGenerate() {
        this.track('qr_code_generate');
    },
    
    trackScreenshotCapture() {
        this.track('screenshot_capture');
    },
    
    // Text & Image Explosions
    trackTextExplosion(textLength) {
        // Bucket text length for privacy
        let bucket = 'short';
        if (textLength > 20) bucket = 'long';
        else if (textLength > 10) bucket = 'medium';
        
        this.track('text_explosion_create', { 
            text_length: bucket
        });
    },
    
    trackImageExplosion(imageType) {
        this.track('image_explosion_create', { 
            image_type: imageType || 'unknown'
        });
    },
    
    // Performance Events
    trackPerformanceMode(batterySaving, reducedMotion) {
        this.track('performance_mode_change', {
            battery_saving: batterySaving ? 'on' : 'off',
            reduced_motion: reducedMotion ? 'on' : 'off'
        });
    },
    
    trackFPSDrop(avgFPS) {
        // Only track significant drops
        if (avgFPS < 30) {
            const bucket = avgFPS < 15 ? 'critical' : avgFPS < 25 ? 'poor' : 'low';
            this.track('fps_drop', { 
                fps_level: bucket 
            });
        }
    },
    
    // UI Events
    trackMenuOpen(menuType) {
        this.track('menu_open', { 
            menu_type: menuType 
        });
    },
    
    trackMenuClose(menuType) {
        this.track('menu_close', { 
            menu_type: menuType 
        });
    },
    
    trackAboutPageView() {
        this.track('about_page_view');
    },
    
    // Session Events
    trackSessionDuration(durationSeconds) {
        // Bucket duration for privacy
        let bucket = 'short';
        if (durationSeconds > 300) bucket = 'long'; // >5 min
        else if (durationSeconds > 60) bucket = 'medium'; // >1 min
        
        this.track('session_duration', { 
            duration: bucket 
        });
    },
    
    trackFirstInteraction() {
        this.track('first_interaction');
    },
    
    // Error Events
    trackError(errorType, errorMessage) {
        this.track('error', {
            error_type: errorType,
            // Don't send full error message for privacy
            has_message: errorMessage ? 'yes' : 'no'
        });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.analytics = analytics;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            analytics.init();
        });
    } else {
        analytics.init();
    }
    
    // Track session duration on page unload; flush any batched firework_launch count first
    let sessionStart = Date.now();
    window.addEventListener('pagehide', () => analytics._flushFireworks());
    window.addEventListener('beforeunload', () => {
        analytics._flushFireworks();
        const duration = Math.floor((Date.now() - sessionStart) / 1000);
        analytics.trackSessionDuration(duration);
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = analytics;
}
