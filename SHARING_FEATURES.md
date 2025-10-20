# Sharing Features - Kaaro Fireworks

## Overview
Complete sharing and configuration system for maximum shareability and user engagement.

---

## ✅ Implemented Features

### 1. URL-Based Config Sharing
Share your exact fireworks configuration via URL parameters.

**How it works:**
- Configuration encoded in base64 and added to URL
- Includes: background, explosion type, audio preset, volume
- Automatically loads when someone visits your shared link

**Example URL:**
```
https://kaarofireworks.netlify.app/?config=eyJiYWNrZ3JvdW5kIjoic3RhcnJ5IiwiZXhwbG9zaW9uVHlwZSI6ImhlYXJ0IiwiYXVkaW9QcmVzZXQiOiJyZWFsaXN0aWMiLCJ2b2x1bWUiOjAuN30=
```

**Usage:**
```javascript
// Generate share URL
const url = generateShareURL();

// Load config from URL (automatic on page load)
getConfigFromURL();
```

### 2. Screenshot Capture
Capture and download the current fireworks display.

**Features:**
- High-quality PNG export
- Automatic watermark ("Kaaro Fireworks")
- Timestamped filename
- One-click download

**Usage:**
- Click "📸 Capture Screenshot" button
- Image saves to downloads folder
- Filename: `kaaro-fireworks-[timestamp].png`

**Technical:**
```javascript
captureScreenshot() // Returns true/false
```

### 3. Save/Load Configurations
Save your favorite configurations locally.

**Features:**
- LocalStorage-based persistence
- Custom naming (up to 20 characters)
- Timestamp tracking
- Easy load/delete
- Sorted by most recent

**Saved Data:**
- Background setting
- Explosion type
- Audio preset
- Volume level
- Timestamp

**Usage:**
```javascript
// Save configuration
saveConfiguration('My Favorite');

// Load configuration
loadConfiguration('My Favorite');

// Get all saved configs
getSavedConfigurations();

// Delete configuration
deleteConfiguration('My Favorite');
```

### 4. Preset Shows
5 choreographed fireworks sequences.

**Shows Available:**

#### 🌈 Rainbow
- 5 fireworks in sequence
- Different types: standard, star, heart, ring, chrysanthemum
- Spread across screen
- Duration: ~1.5 seconds

#### 💧 Cascade
- 5 willow-type fireworks
- Left to right cascade effect
- Staggered timing (200ms intervals)
- Duration: ~1 second

#### 🎆 Finale
- 8 fireworks burst
- Multiple types mixed
- Dense, spectacular display
- Duration: ~1.5 seconds

#### ⚖️ Symmetry
- Symmetrical pattern
- Mirrored left/right
- 5 fireworks total
- Duration: ~1.5 seconds

#### 🎉 Celebration
- Heart-centered design
- Stars and chrysanthemums
- 6 fireworks total
- Duration: ~1.5 seconds

**Usage:**
```javascript
// Play a show
playPresetShow('finale');

// Stop current show
stopPresetShow();
```

**Show Format:**
```javascript
{
    delay: 0,        // ms from start
    x: 0.5,          // 0-1 (percentage of width)
    y: 0.3,          // 0-1 (percentage of height)
    type: 'heart'    // explosion type
}
```

### 5. Social Media Sharing
Native share functionality with fallbacks.

**Features:**
- Native Web Share API (mobile)
- Fallback to clipboard copy
- Share URL with configuration
- Custom message

**Platforms Supported:**
- WhatsApp
- Facebook
- Twitter
- Telegram
- Email
- SMS
- Any app that supports sharing

**Usage:**
- Click "🚀 Share" button
- Select app from native share sheet
- Configuration URL automatically included

### 6. Copy Link
One-click link copying with visual feedback.

**Features:**
- Clipboard API with fallback
- Success message
- Encoded configuration in URL
- Works on all browsers

### 7. QR Code Generation
Generate QR code for easy mobile sharing.

**Features:**
- 200x200px QR code
- Toggle show/hide
- Scannable with any QR reader
- Includes full configuration URL

**API Used:**
- QR Server API (https://api.qrserver.com)
- Fallback error handling
- Cross-origin compatible

---

## User Interface

### Share Panel (📤 Button)
Located in top-right corner, accessible via share button.

**Sections:**

1. **Quick Actions**
   - 📸 Capture Screenshot
   - 🔗 Copy Share Link
   - 📱 Show QR Code
   - 🚀 Share

2. **Preset Shows**
   - 🌈 Rainbow
   - 💧 Cascade
   - 🎆 Finale
   - ⚖️ Symmetry
   - 🎉 Celebration

3. **Save Configuration**
   - Text input for name
   - 💾 Save button
   - List of saved configs
   - Load/delete options

4. **Status Messages**
   - Success messages (green)
   - Error messages (red)
   - Auto-hide after 3 seconds

---

## Technical Implementation

### URL Encoding
```javascript
// Encode config to URL
const config = { background: 'starry', ... };
const encoded = btoa(JSON.stringify(config));
const url = `${baseURL}?config=${encoded}`;

// Decode config from URL
const params = new URLSearchParams(window.location.search);
const encoded = params.get('config');
const config = JSON.parse(atob(encoded));
```

### LocalStorage Structure
```javascript
{
  "fireworksConfigs": {
    "My Favorite": {
      "background": "starry",
      "explosionType": "heart",
      "audioPreset": "realistic",
      "volume": 0.7,
      "timestamp": 1729411200000
    },
    "Party Mode": {
      ...
    }
  }
}
```

### Screenshot Process
1. Create temporary canvas
2. Copy current canvas content
3. Add watermark
4. Convert to blob
5. Create download link
6. Trigger download
7. Clean up

### Show Execution
1. Parse show definition
2. Schedule each firework with setTimeout
3. Track timeouts for cancellation
4. Convert relative positions to absolute
5. Temporarily override explosion type
6. Clean up after completion

---

## Browser Compatibility

### Web Share API
- ✅ Chrome/Edge (Android, Desktop)
- ✅ Safari (iOS, macOS)
- ❌ Firefox (fallback to copy)

### Clipboard API
- ✅ All modern browsers
- ✅ Fallback for older browsers

### LocalStorage
- ✅ All browsers
- 5-10MB storage limit

### Canvas Export
- ✅ All browsers
- PNG format support

---

## Usage Examples

### Share Custom Configuration
```javascript
// User customizes settings
config.background = 'city';
selectedExplosionType = 'heart';
audioConfig.preset = 'cartoonish';

// Generate and share URL
const url = generateShareURL();
// https://...?config=eyJiYWNrZ3JvdW5kIjoiY2l0eSIsImV4cGxvc2lvblR5cGUiOiJoZWFydCIsImF1ZGlvUHJlc2V0IjoiY2FydG9vbmlzaCIsInZvbHVtZSI6MC43fQ==
```

### Create Custom Show
```javascript
const myShow = [
    { delay: 0, x: 0.5, y: 0.3, type: 'heart' },
    { delay: 500, x: 0.3, y: 0.25, type: 'star' },
    { delay: 500, x: 0.7, y: 0.25, type: 'star' }
];

presetShows['myShow'] = myShow;
playPresetShow('myShow');
```

### Save and Load
```javascript
// Save current config
saveConfiguration('Birthday Party');

// Later, load it back
loadConfiguration('Birthday Party');

// List all saved configs
const configs = getSavedConfigurations();
console.log(Object.keys(configs)); // ['Birthday Party', ...]
```

---

## Performance Considerations

### URL Length
- Base64 encoding increases size by ~33%
- Typical config URL: ~200 characters
- Browser URL limit: 2000+ characters
- No issues with current implementation

### LocalStorage
- Each config: ~150 bytes
- Limit: 5-10MB
- Can store 30,000+ configurations
- No performance impact

### QR Code
- External API call
- Cached by browser
- Fallback on failure
- No impact on app performance

### Screenshot
- Temporary canvas creation
- Memory cleaned up immediately
- No performance impact
- Works on mobile

---

## Future Enhancements

### Not Yet Implemented
- [ ] GIF recording (requires external library)
- [ ] Video export
- [ ] Multi-launch mode (hold to launch)
- [ ] Rapid fire mode
- [ ] Synchronized burst mode
- [ ] Show editor (timeline UI)
- [ ] Advanced control panel
- [ ] Cloud save (requires backend)
- [ ] Social media direct posting
- [ ] Embed code generator

### Potential Additions
- [ ] Share to specific platforms (Twitter, Facebook)
- [ ] Custom QR code styling
- [ ] Animated GIF export
- [ ] Show marketplace/gallery
- [ ] Collaborative shows
- [ ] Show scheduling
- [ ] Analytics tracking

---

## Testing Checklist

- [x] URL config encoding/decoding
- [x] Screenshot capture and download
- [x] Save configuration to LocalStorage
- [x] Load configuration from LocalStorage
- [x] Delete configuration
- [x] Copy link to clipboard
- [x] QR code generation
- [x] Native share (mobile)
- [x] Preset shows playback
- [x] Show stop functionality
- [x] Success/error messages
- [x] UI updates from loaded config
- [x] Mobile compatibility
- [x] Browser fallbacks

---

## Known Limitations

1. **URL Sharing**: Config only, not visual state
2. **LocalStorage**: Browser-specific, not synced
3. **QR Code**: Requires internet for API
4. **Web Share**: Not supported in all browsers
5. **Screenshot**: No animation capture (single frame)

---

## Support

### Troubleshooting

**"Link copied" doesn't work:**
- Check browser clipboard permissions
- Try fallback (manual copy)

**QR code doesn't load:**
- Check internet connection
- API may be temporarily down
- Use copy link instead

**Saved configs disappeared:**
- LocalStorage cleared by browser
- Private/incognito mode doesn't persist
- Different browser = different storage

**Share button doesn't appear:**
- Browser doesn't support Web Share API
- Use copy link instead

---

## API Reference

### Configuration Functions
```javascript
getConfigFromURL()           // Load config from URL params
generateShareURL()           // Generate shareable URL
saveConfiguration(name)      // Save to LocalStorage
loadConfiguration(name)      // Load from LocalStorage
getSavedConfigurations()     // Get all saved configs
deleteConfiguration(name)    // Delete saved config
```

### Sharing Functions
```javascript
captureScreenshot()          // Capture and download
shareScreenshot()            // Share with native API
generateQRCode(url)          // Generate QR code
```

### Show Functions
```javascript
playPresetShow(name)         // Play choreographed show
stopPresetShow()             // Stop current show
```

### UI Functions
```javascript
showShareMessage(msg, success)  // Show status message
updateUIFromConfig()            // Update UI from config
updateSavedConfigsList()        // Refresh saved list
```

---

**Status**: Production Ready ✅  
**Last Updated**: October 20, 2025  
**Version**: 2.0
