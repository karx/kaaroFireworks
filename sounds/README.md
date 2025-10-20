# Firework Sound Samples

## Current Samples

We currently have **3 firework sound samples**:

### Launch Sounds (1 file)
- `launch_1.ogg` (34KB) - Whoosh/trail sound

### Explosion Sounds (2 files)
- `firework 1.ogg` (25KB) - Standard burst
- `firework 2.ogg` (25KB) - Alternate explosion

These samples are used by all sample-based audio presets (Realistic, Epic, Minimal, Cartoonish, Balanced).

## Directory Structure

```
sounds/
├── launch/          # Launch/whoosh sounds (1 file)
│   └── launch_1.ogg
├── explosion/       # Explosion/burst sounds (2 files)
│   ├── firework 1.ogg
│   └── firework 2.ogg
└── ambient/         # Optional ambient sounds (empty - future)
```

## Sample Requirements

- **Format**: OGG Vorbis
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Depth**: 16-bit
- **Duration**: 1-3 seconds
- **Size**: <100KB per file
- **License**: CC0, CC-BY, or Public Domain

## Naming Convention

### Launch Sounds
- `launch_1.ogg` - Standard whoosh
- `launch_2.ogg` - Alternate whoosh
- `launch_3.ogg` - Variation

### Explosion Sounds
- `explosion_1.ogg` - Standard burst
- `explosion_2.ogg` - Deep boom
- `explosion_3.ogg` - Bright pop
- `explosion_4.ogg` - Crackling burst
- `explosion_5.ogg` - Willow effect
- `explosion_6.ogg` - Multiple pops
- `explosion_7.ogg` - Whistling burst
- `explosion_8.ogg` - Thunder boom

### Ambient Sounds (Optional)
- `crowd_cheer.ogg` - Crowd reactions
- `distant_fireworks.ogg` - Background ambience

## Finding Samples

### Free Sources
1. **Freesound.org** - Search "firework explosion", "firework launch"
2. **OpenGameArt.org** - Game audio assets
3. **Zapsplat.com** - Free sound effects
4. **BBC Sound Effects** - Public domain archive
5. **YouTube Audio Library** - Royalty-free sounds

### Converting to OGG
If you have WAV/MP3 files, convert using:
```bash
ffmpeg -i input.wav -c:a libvorbis -q:a 4 output.ogg
```

## License
All samples must be:
- CC0 (Public Domain)
- CC-BY (with attribution)
- Or explicitly licensed for commercial use

## Attribution
If using CC-BY samples, list attributions here:

- `explosion_1.ogg` - [Author Name] - [License] - [Source URL]
- `launch_1.ogg` - [Author Name] - [License] - [Source URL]
