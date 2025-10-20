# Audio Presets Guide

Quick reference for all audio presets in Kaaro Fireworks.

## Sample-Based Presets

These presets use real firework sound recordings (3 OGG files).

### 🎵 Realistic (Default)
**Best for**: Natural, authentic firework experience

- **Volume**: 100% (1.0x)
- **Reverb**: 40% (moderate echo)
- **Pitch Variation**: ±10% (natural variety)
- **Distance Falloff**: 50% (balanced)
- **Sound**: Natural recorded fireworks
- **Use Case**: Default experience, most realistic

### 🎆 Epic
**Best for**: Dramatic, cinematic firework shows

- **Volume**: 120% (1.2x - louder)
- **Reverb**: 70% (heavy echo)
- **Pitch Variation**: ±5% (consistent)
- **Distance Falloff**: 30% (reduced - sounds closer)
- **Sound**: Powerful, dramatic explosions
- **Use Case**: Big celebrations, impressive displays

### 🔇 Minimal
**Best for**: Subtle, quiet background fireworks

- **Volume**: 70% (0.7x - quieter)
- **Reverb**: 15% (very light echo)
- **Pitch Variation**: ±5% (consistent)
- **Distance Falloff**: 70% (strong - sounds farther)
- **Sound**: Soft, distant explosions
- **Use Case**: Background ambience, quiet environments

### 🎪 Cartoonish
**Best for**: Playful, fun firework experience

- **Volume**: 100% (1.0x)
- **Reverb**: 20% (light echo)
- **Pitch Variation**: ±15% (more variety)
- **Distance Falloff**: 40% (moderate)
- **Sound**: Bright, playful explosions
- **Use Case**: Fun events, children's shows

### ⚖️ Balanced
**Best for**: Perfect middle ground

- **Volume**: 90% (0.9x)
- **Reverb**: 30% (moderate echo)
- **Pitch Variation**: ±8% (balanced variety)
- **Distance Falloff**: 45% (balanced)
- **Sound**: Well-balanced explosions
- **Use Case**: General use, versatile

## Synthesis-Based Preset

This preset uses Web Audio API to generate sounds in real-time.

### 🎹 Synthesized
**Best for**: Original synthesis experience, no samples needed

- **Volume**: 100% (1.0x)
- **Reverb**: 40% (moderate echo)
- **Pitch Variation**: None (consistent)
- **Distance Falloff**: 50% (balanced)
- **Sound**: Synthesized white noise + crackling
- **Crackling**: Enabled (3000-5000 Hz sparkles)
- **Use Case**: Original experience, fallback if samples fail

## Spatial Audio Effects

All presets include these spatial effects:

### Stereo Panning
- Left explosions → Left speaker
- Right explosions → Right speaker
- Center explosions → Both speakers

### Distance-Based Volume
- Center explosions → Louder
- Edge explosions → Quieter
- Falloff varies by preset

### Reverb/Echo
- Configurable 0-100% via slider
- Each preset has optimal default
- Simulates environment acoustics

## Technical Details

### Sample Files
Located in `sounds/explosion/`:
- `firework 1.ogg` (25KB)
- `firework 2.ogg` (25KB)
- `firework 3.ogg` (34KB)

### Audio Pipeline
```
Sample/Synthesis
    ↓
Playback Rate (pitch variation)
    ↓
Stereo Panner (position)
    ↓
Gain Node (distance volume)
    ↓
Convolver (reverb)
    ↓
Master Gain (volume slider)
    ↓
Output
```

### Preset Selection Logic
```javascript
if (preset.useSamples && samples.loaded) {
    // Use OGG samples
    playExplosionSound();
} else {
    // Use synthesis
    playExplosionSoundFallback();
}
```

## Choosing the Right Preset

**For realism**: Realistic (default)  
**For impact**: Epic  
**For subtlety**: Minimal  
**For fun**: Cartoonish  
**For balance**: Balanced  
**For original**: Synthesized

## User Controls

Users can adjust:
- **Preset**: Dropdown selector (6 options)
- **Volume**: Slider (0-100%)
- **Reverb**: Slider (0-100%)

All other parameters are preset-specific and optimized for best experience.
