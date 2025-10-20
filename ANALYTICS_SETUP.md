# Analytics Setup for Kaaro Fireworks

## Analytics Solution: Plausible Analytics

**Why Plausible?**
- ✅ Privacy-friendly (GDPR, CCPA compliant)
- ✅ No cookies, no personal data collection
- ✅ Lightweight (<1KB script)
- ✅ Simple, beautiful dashboard
- ✅ Custom event tracking
- ✅ No impact on page performance
- ✅ Open source option available

**Alternatives Considered:**
- Google Analytics 4: Too heavy, privacy concerns, complex
- Umami: Good but requires self-hosting
- PostHog: Feature-rich but overkill for this project

## Key Metrics to Track

### 1. Page Views & Sessions
- Total page views
- Unique visitors
- Session duration
- Bounce rate
- Geographic distribution
- Device types (mobile vs desktop)

### 2. User Engagement Events

#### Firework Interactions
- `firework_launch` - User launches a firework
  - Properties: `explosion_type`, `is_mobile`
- `firework_burst` - Firework explodes
  - Properties: `particle_count`, `explosion_type`
- `auto_show_start` - User starts automated show
- `auto_show_stop` - User stops automated show

#### Configuration Changes
- `background_change` - User changes background
  - Properties: `background_type` (starry/city/black)
- `audio_preset_change` - User changes audio preset
  - Properties: `preset` (realistic/cartoonish/minimal/epic/balanced)
- `volume_change` - User adjusts volume
  - Properties: `volume_level`
- `explosion_type_change` - User selects explosion type
  - Properties: `type` (burst/ring/heart/star/spiral/willow/random)

#### Multi-User Features
- `room_create` - User creates a sync room
- `room_join` - User joins a sync room
  - Properties: `room_id`
- `room_leave` - User leaves a sync room
- `sync_firework_send` - User sends synced firework
- `sync_firework_receive` - User receives synced firework

#### Sharing & Saving
- `config_save` - User saves configuration
- `config_load` - User loads saved configuration
- `share_url_generate` - User generates share URL
- `share_url_copy` - User copies share URL
- `qr_code_generate` - User generates QR code
- `screenshot_capture` - User captures screenshot

#### Performance
- `performance_mode_change` - User toggles performance settings
  - Properties: `battery_saving`, `reduced_motion`
- `fps_drop` - FPS drops below threshold
  - Properties: `avg_fps`

#### Text & Image Explosions
- `text_explosion_create` - User creates text explosion
  - Properties: `text_length`
- `image_explosion_create` - User creates image explosion
  - Properties: `image_type`

### 3. Technical Metrics
- Page load time
- Time to interactive
- Browser types
- Screen resolutions
- Referrer sources

### 4. Goals/Conversions
- First firework launch (engagement)
- Multi-user room creation (feature adoption)
- Configuration save (power user)
- Share URL generation (viral growth)

## Implementation Plan

### Step 1: Sign up for Plausible
1. Go to https://plausible.io/
2. Create account (€9/month for 10k pageviews, or self-host for free)
3. Add domain: `pattaka.netlify.app`
4. Get tracking script

### Step 2: Add Tracking Script
Add to `index.html` `<head>`:
```html
<script defer data-domain="pattaka.netlify.app" src="https://plausible.io/js/script.js"></script>
```

For custom events, use:
```html
<script defer data-domain="pattaka.netlify.app" src="https://plausible.io/js/script.tagged-events.js"></script>
```

### Step 3: Create Analytics Module
Create `js/analytics.js` to centralize all tracking:
```javascript
// Analytics module
const analytics = {
    initialized: false,
    
    init() {
        // Check if Plausible is loaded
        this.initialized = typeof window.plausible !== 'undefined';
        if (!this.initialized) {
            console.warn('Analytics not loaded');
        }
    },
    
    track(eventName, props = {}) {
        if (!this.initialized) return;
        
        try {
            window.plausible(eventName, { props });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    },
    
    // Convenience methods
    trackFireworkLaunch(explosionType, isMobile) {
        this.track('firework_launch', { 
            explosion_type: explosionType,
            is_mobile: isMobile 
        });
    },
    
    trackBackgroundChange(backgroundType) {
        this.track('background_change', { 
            background_type: backgroundType 
        });
    },
    
    trackAudioPresetChange(preset) {
        this.track('audio_preset_change', { preset });
    },
    
    trackRoomCreate() {
        this.track('room_create');
    },
    
    trackRoomJoin(roomId) {
        this.track('room_join', { room_id: roomId });
    },
    
    trackConfigSave() {
        this.track('config_save');
    },
    
    trackShareURLGenerate() {
        this.track('share_url_generate');
    },
    
    trackScreenshotCapture() {
        this.track('screenshot_capture');
    },
    
    trackTextExplosion(textLength) {
        this.track('text_explosion_create', { 
            text_length: textLength 
        });
    },
    
    trackImageExplosion(imageType) {
        this.track('image_explosion_create', { 
            image_type: imageType 
        });
    },
    
    trackPerformanceMode(batterySaving, reducedMotion) {
        this.track('performance_mode_change', {
            battery_saving: batterySaving,
            reduced_motion: reducedMotion
        });
    },
    
    trackFPSDrop(avgFPS) {
        this.track('fps_drop', { avg_fps: avgFPS });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.analytics = analytics;
}
```

### Step 4: Integrate Tracking Calls
Add tracking calls throughout the codebase:

**In `js/fireworks.js`:**
```javascript
function launchFirework(x, y) {
    // ... existing code ...
    window.analytics?.trackFireworkLaunch(
        window.selectedExplosionType,
        window.config.isMobile
    );
}
```

**In `js/config.js`:**
```javascript
function changeBackground(type) {
    // ... existing code ...
    window.analytics?.trackBackgroundChange(type);
}
```

**In `js/sync.js`:**
```javascript
function createRoom() {
    // ... existing code ...
    window.analytics?.trackRoomCreate();
}

function joinRoom(roomId) {
    // ... existing code ...
    window.analytics?.trackRoomJoin(roomId);
}
```

**In `app.js`:**
```javascript
function saveConfiguration(name) {
    // ... existing code ...
    window.analytics?.trackConfigSave();
}

function generateShareURL() {
    // ... existing code ...
    window.analytics?.trackShareURLGenerate();
}

function captureScreenshot() {
    // ... existing code ...
    window.analytics?.trackScreenshotCapture();
}
```

### Step 5: Privacy Considerations
- ✅ No cookies used
- ✅ No personal data collected
- ✅ IP addresses anonymized
- ✅ GDPR compliant by default
- ✅ No consent banner needed

Add privacy note to `about.html`:
```html
<h3>Privacy & Analytics</h3>
<p>We use privacy-friendly analytics (Plausible) to understand how people use this app. 
No cookies, no personal data, no tracking across websites. 
<a href="https://plausible.io/data-policy">Learn more</a></p>
```

## Dashboard Setup

### Custom Goals in Plausible
1. `firework_launch` - Track engagement
2. `room_create` - Track multi-user adoption
3. `config_save` - Track power users
4. `share_url_generate` - Track viral potential

### Useful Reports
- **Top Pages**: Which pages get most traffic
- **Entry Pages**: How users discover the app
- **Exit Pages**: Where users leave
- **Devices**: Mobile vs Desktop usage
- **Locations**: Geographic distribution
- **Sources**: Referrers and traffic sources
- **Custom Events**: All tracked interactions

## Cost Estimate

**Plausible Cloud:**
- 10k pageviews/month: €9/month (~$10)
- 100k pageviews/month: €19/month (~$21)

**Self-Hosted (Free):**
- Requires server (can use existing Netlify/Vercel)
- PostgreSQL database
- More setup but $0 cost

**Recommendation:** Start with Plausible Cloud for simplicity, migrate to self-hosted if traffic grows significantly.

## Testing

### Local Testing
Plausible won't track on localhost by default. To test:
1. Use `data-domain` attribute with test domain
2. Check browser console for tracking calls
3. Use Plausible's "Live View" to see real-time events

### Verification Checklist
- [ ] Script loads without errors
- [ ] Page views tracked
- [ ] Custom events fire correctly
- [ ] No console errors
- [ ] Dashboard shows data within 1-2 minutes
- [ ] Mobile tracking works
- [ ] No performance impact (check Lighthouse)

## Alternative: Google Analytics 4 (Not Recommended)

If you must use GA4:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Downsides:**
- Requires cookie consent banner
- ~45KB script size
- Privacy concerns
- Complex setup
- Overkill for this project

## Next Steps

1. ✅ Choose Plausible as analytics solution
2. ⏳ Sign up for Plausible account
3. ⏳ Add tracking script to index.html
4. ⏳ Create analytics.js module
5. ⏳ Integrate tracking calls
6. ⏳ Test implementation
7. ⏳ Monitor dashboard for insights

## Expected Insights

After 1-2 weeks of data:
- **Engagement**: How many fireworks per session?
- **Features**: Which explosion types are most popular?
- **Multi-user**: How many rooms created? Average participants?
- **Mobile**: What % of users are on mobile?
- **Retention**: Do users come back?
- **Sharing**: How viral is the share feature?
- **Performance**: Any FPS issues on specific devices?

This data will guide future development priorities! 🚀
