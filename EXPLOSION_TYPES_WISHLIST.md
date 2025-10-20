# Explosion Types & Shapes - Refactoring Wishlist

## Current State Analysis

### What We Have
**7 Explosion Types**:
1. Standard - Basic sphere burst
2. Willow - Sphere with trails, slower fall
3. Chrysanthemum - Multi-color sphere with trails
4. Palm - 2-color sphere with trails, faster fall
5. Star - 5-pointed star shape
6. Heart - Heart shape
7. Ring - Perfect circle

**4 Explosion Shapes**:
- Sphere (used by 4 types)
- Star (5-pointed)
- Heart (parametric curve)
- Ring (perfect circle)

### Current Issues

#### 1. **Confusing Naming** ❌
- "Explosion Type" vs "Shape" - users don't understand the difference
- Types like "Willow" and "Palm" are just sphere variations
- Not clear what makes each type unique

#### 2. **Poor Visual Distinction** ❌
- Standard, Willow, Chrysanthemum, Palm all look similar (spheres)
- Only difference is trails and colors
- Hard to tell them apart during fireworks

#### 3. **Inconsistent Selection** ❌
- `selectedExplosionType` is a global variable in ui.js
- Not properly scoped or managed
- Confusing state management across modules

#### 4. **Limited Variety** ❌
- Only 4 actual shapes (sphere, star, heart, ring)
- Missing exciting shapes: spiral, crossette, peony, dahlia
- No combination effects

#### 5. **No Audio Variation** ❌
- All explosion types use same sound samples
- Should have different sounds for different types
- Missed opportunity for immersion

#### 6. **Mobile UX Issues** ❌
- Dropdown is hard to use on mobile
- No visual preview of explosion types
- Can't quickly switch between types

## Targeted Wishlist

### Priority 1: Simplify & Clarify (2-3 hours)

#### 1.1 Merge Types into Shapes
**Problem**: Confusing distinction between "type" and "shape"

**Solution**: Single "Firework Style" selector
- Sphere (classic burst)
- Star (5-pointed)
- Heart (romantic)
- Ring (perfect circle)
- Willow (drooping trails)
- Chrysanthemum (multi-burst)
- Palm (palm tree effect)
- Spiral (rotating burst)

**Implementation**:
```javascript
const fireworkStyles = {
    sphere: {
        shape: 'sphere',
        colors: 1,
        trail: false,
        gravity: 0.05,
        description: 'Classic burst'
    },
    star: {
        shape: 'star',
        colors: 1,
        trail: false,
        gravity: 0.05,
        description: '5-pointed star'
    },
    // ... etc
}
```

#### 1.2 Visual Style Selector
**Problem**: Dropdown is boring and unclear

**Solution**: Visual grid selector with icons/previews
- Show small animated preview of each style
- Click to select
- Better mobile UX
- More engaging

**UI Mockup**:
```
[💥 Sphere] [⭐ Star] [❤️ Heart] [⭕ Ring]
[🌿 Willow] [🌸 Chrys] [🌴 Palm] [🌀 Spiral]
```

#### 1.3 Proper State Management
**Problem**: Global variable mess

**Solution**: Centralized config object
```javascript
window.fireworkConfig = {
    style: 'sphere',
    background: 'starry',
    audioPreset: 'realistic',
    // ... etc
}
```

### Priority 2: Add New Shapes (3-4 hours) ✅ COMPLETE

#### 2.1 Spiral Shape ✅
Particles rotate outward in spiral pattern (Completed in Priority 1)
```javascript
spiral: (count) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 4; // 2 rotations
        const radius = (i / count) * 5;
        const speed = 3 + Math.random();
        particles.push({
            vx: Math.cos(angle) * speed * radius,
            vy: Math.sin(angle) * speed * radius
        });
    }
    return particles;
}
```

#### 2.2 Crossette Shape ✅
Particles split into smaller bursts
- 8 cluster directions
- Spread within each cluster
- Split burst pattern effect
- Icon: ✨

#### 2.3 Peony Shape ✅
Dense center, sparse edges
- Gaussian distribution for speed
- More particles in center
- Classic firework look
- Icon: 🌺

#### 2.4 Double Ring ✅
Two concentric rings
- Inner ring: 40% particles, faster (speed 5)
- Outer ring: 60% particles, slower (speed 3)
- Beautiful layered effect
- Icon: ⭕⭕

### Priority 3: Audio Variation (2 hours)

#### 3.1 Style-Specific Sounds
Different sounds for different styles:
- **Sphere/Standard**: Current explosion samples
- **Willow**: Softer, longer decay
- **Chrysanthemum**: Multiple pops
- **Star/Heart/Ring**: Sharper, crisper
- **Spiral**: Whooshing sound

**Implementation**:
```javascript
const styleAudioConfig = {
    sphere: { sample: 'explosion', variation: 0.2 },
    willow: { sample: 'explosion', variation: 0.1, decay: 1.5 },
    star: { sample: 'explosion', variation: 0.3, filter: 'bright' },
    // ... etc
}
```

#### 3.2 Layered Sounds
Combine multiple samples for complex effects:
- Base explosion
- Crackling overlay
- Whoosh for spiral
- Multiple pops for chrysanthemum

### Priority 4: Enhanced UX (2-3 hours)

#### 4.1 Quick Select Buttons
Instead of dropdown, use button grid:
```html
<div class="firework-style-grid">
    <button class="style-btn active" data-style="sphere">
        <span class="icon">💥</span>
        <span class="label">Sphere</span>
    </button>
    <!-- ... more buttons -->
</div>
```

#### 4.2 Preview on Hover
Show small preview animation when hovering over style button
- Mini canvas with preview
- Helps users understand what they're selecting
- Better UX

#### 4.3 Favorites System
Let users mark favorite styles
- Star icon to favorite
- Quick access to favorites
- Saved in localStorage

#### 4.4 Random Variety Mode
New mode: "Surprise Me"
- Randomly picks different styles
- Weighted toward favorites
- More dynamic shows

## Implementation Plan

### Phase 1: Refactor (Week 1)
1. Merge explosion types and shapes into single system
2. Rename to "Firework Styles"
3. Clean up state management
4. Update UI to button grid
5. Test thoroughly

### Phase 2: New Shapes (Week 2)
1. Add spiral shape
2. Add crossette shape
3. Add peony shape
4. Add double ring shape
5. Test and polish

### Phase 3: Audio (Week 3)
1. Map styles to audio variations
2. Implement style-specific sound processing
3. Add layered sounds for complex effects
4. Test audio variety

### Phase 4: UX Polish (Week 4)
1. Add preview animations
2. Implement favorites system
3. Add "Surprise Me" mode
4. Mobile optimization
5. Final testing

## Success Metrics

- **Clarity**: Users understand what each style does
- **Variety**: Visually distinct firework effects
- **Engagement**: Users try different styles
- **Audio**: Sounds match visual effects
- **Mobile**: Easy to use on touch devices

## Technical Debt to Address

1. **Global Variables**: Move to proper config object
2. **Module Coupling**: Decouple explosion logic from UI
3. **Code Duplication**: DRY up shape generation code
4. **Performance**: Optimize particle generation
5. **Testing**: Add unit tests for shapes

## Breaking Changes

- `explosionTypes` → `fireworkStyles`
- `selectedExplosionType` → `fireworkConfig.style`
- UI dropdown → button grid

**Migration**: Keep backward compatibility for saved configs

## Estimated Time

- **Priority 1**: 2-3 hours (simplify & clarify)
- **Priority 2**: 3-4 hours (new shapes)
- **Priority 3**: 2 hours (audio variation)
- **Priority 4**: 2-3 hours (UX polish)

**Total**: 9-12 hours over 2-3 weeks

## Quick Wins (Do First)

1. **Rename to "Firework Style"** (15 min)
2. **Add visual icons to dropdown** (30 min)
3. **Fix state management** (1 hour)
4. **Add spiral shape** (1 hour)

These give immediate improvement with minimal effort!

## Notes

- Keep it simple - don't over-engineer
- Focus on visual distinction
- Audio should enhance, not distract
- Mobile-first design
- Test with real users
