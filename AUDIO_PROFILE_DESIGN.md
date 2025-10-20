# Audio Profile System Design

## Overview
Create a comprehensive, user-configurable audio profile system that allows fine-tuned control over all aspects of firework sounds.

## Audio Components

### 1. Launch Sound
- **Frequency Range**: Start and end frequency of the whoosh
- **Duration**: How long the launch sound lasts
- **Volume**: Launch sound volume

### 2. Explosion Sound
- **Base Frequency**: Main explosion frequency
- **Frequency Sweep**: How much frequency changes
- **Duration**: Explosion sound duration
- **Volume**: Explosion volume

### 3. Crackling/Sparkle (The "Jingle")
- **Intensity**: Number of crackle sounds (0-1)
- **Frequency Range**: Pitch of crackles (3000-5000 Hz)
- **Duration**: How long crackles last
- **Volume**: Crackle volume
- **Delay**: When crackles start after explosion

### 4. Reverb
- **Amount**: Wet/dry mix (0-1)
- **Decay**: How long reverb lasts

### 5. Global Settings
- **Master Volume**: Overall volume
- **Stereo Width**: Panning intensity
- **Distance Falloff**: How much volume decreases with distance

## Audio Profile Structure

```javascript
{
    name: "Custom Profile",
    
    launch: {
        freqStart: 200,      // Hz
        freqEnd: 800,        // Hz
        duration: 0.3,       // seconds
        volume: 0.5          // 0-1
    },
    
    explosion: {
        baseFreq: 2000,      // Hz
        freqSweep: 1900,     // Hz (baseFreq - freqSweep = end freq)
        duration: 0.3,       // seconds
        volume: 0.3,         // 0-1
        variations: 3        // Number of slight variations
    },
    
    crackling: {
        enabled: true,
        intensity: 0.4,      // 0-1 (affects count)
        freqMin: 3000,       // Hz
        freqMax: 5000,       // Hz
        duration: 0.05,      // seconds per crackle
        volume: 0.05,        // 0-1
        delay: 50,           // ms before starting
        spread: 200          // ms random spread
    },
    
    reverb: {
        amount: 0.4,         // 0-1 wet/dry mix
        decay: 2.0           // seconds
    },
    
    global: {
        masterVolume: 0.7,
        stereoWidth: 1.0,    // 0-1 panning intensity
        distanceFalloff: 0.5 // 0-1 how much distance affects volume
    }
}
```

## Preset Profiles

### Realistic
- Moderate launch whoosh
- Deep explosion with natural decay
- Medium crackling
- Balanced reverb

### Cartoonish
- High-pitched launch
- Bright explosion
- Lots of crackling
- Minimal reverb

### Minimal
- Subtle launch
- Clean explosion
- No crackling
- Very light reverb

### Epic
- Deep, powerful launch
- Massive explosion
- Heavy crackling
- Large reverb

### Balanced
- Middle ground for all parameters

### Silent Sparkle (NEW)
- No launch/explosion
- Only crackling sounds
- Great for subtle effects

### Deep Boom (NEW)
- Very low frequency explosion
- No crackling
- Heavy reverb

## UI Design

### Simple Mode (Current)
- Audio Preset dropdown
- Volume slider
- Reverb slider

### Advanced Mode (NEW)
- Expandable "Advanced Audio" section
- Grouped controls:
  - **Launch**: Frequency, Duration, Volume
  - **Explosion**: Frequency, Sweep, Duration, Volume
  - **Crackling**: Enable/Disable, Intensity, Frequency, Volume
  - **Reverb**: Amount, Decay
  - **Global**: Stereo Width, Distance Falloff
- Save Custom Profile button
- Load Custom Profile dropdown

## Implementation Plan

### Phase 1: Core System
1. Extend audioConfig with full profile structure
2. Update playExplosionSound() to use profile parameters
3. Add playLaunchSound() with configurable parameters
4. Update playCracklingSound() with profile parameters

### Phase 2: UI Controls
1. Add "Advanced Audio" collapsible section
2. Add sliders for all parameters
3. Add real-time preview
4. Add visual feedback

### Phase 3: Presets & Saving
1. Create 7 preset profiles
2. Add custom profile save/load
3. Add profile import/export (JSON)
4. Add profile sharing via URL

### Phase 4: Polish
1. Add tooltips explaining each parameter
2. Add "Reset to Preset" button
3. Add A/B comparison feature
4. Add audio waveform visualization

## User Experience

### Beginner Flow
1. Choose from preset dropdown
2. Adjust volume and reverb
3. Done!

### Advanced Flow
1. Start with preset
2. Click "Advanced Audio"
3. Fine-tune individual parameters
4. Save as custom profile
5. Share with friends

### Power User Flow
1. Export profile as JSON
2. Edit in text editor
3. Import back
4. Share URL with exact settings

## Analytics Tracking

Track:
- `audio_profile_change` - When preset changes
- `audio_advanced_open` - When advanced panel opens
- `audio_custom_save` - When custom profile saved
- `audio_parameter_change` - When individual parameter adjusted
- `audio_profile_share` - When profile URL generated

## Technical Considerations

### Performance
- Cache reverb impulse responses
- Throttle parameter updates
- Use Web Audio API efficiently

### Compatibility
- Fallback for browsers without Web Audio API
- Mobile optimization (fewer crackles on mobile)
- Battery saving mode (reduce complexity)

### Accessibility
- Keyboard navigation for all controls
- Screen reader labels
- Visual indicators for audio changes

## Future Enhancements

1. **Audio Samples**: Load custom explosion sounds
2. **MIDI Control**: Map parameters to MIDI controllers
3. **Automation**: Animate parameters over time
4. **Frequency Analyzer**: Visual feedback of sound
5. **Sound Library**: Community-shared profiles
6. **AI Suggestions**: Recommend profiles based on usage

## Success Metrics

- % of users who open advanced controls
- Average number of custom profiles saved
- Most adjusted parameters
- Profile sharing rate
- User satisfaction with audio customization
