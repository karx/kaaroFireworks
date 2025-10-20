# Kaaro Fireworks 🎆

An interactive, high-performance fireworks simulation built with vanilla JavaScript and HTML5 Canvas API.

## Features

- **Realistic Physics**: Particle system with gravity, friction, and parabolic trajectories
- **Visual Effects**: Additive blending for authentic glow and motion blur trails
- **Audio Synthesis**: Web Audio API for synchronized launch and explosion sounds
- **Interactive**: Click anywhere to launch fireworks or use auto-launch mode
- **Responsive**: Full-screen canvas that adapts to any screen size
- **Lightweight**: No external dependencies, pure vanilla JavaScript

## Quick Start

### Local Development

Simply open `index.html` in a modern web browser, or serve with any static file server:

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Deploy to Netlify

#### Option 1: Drag & Drop
1. Visit [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire project folder
3. Your site is live!

#### Option 2: Git Integration
1. Push this repository to GitHub
2. Log in to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Netlify will auto-detect the configuration from `netlify.toml`
6. Click "Deploy site"

#### Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## Usage

- **Click/Tap**: Launch a firework at the clicked location
- **Auto Launch Button**: Toggle continuous automatic firework launches
- **Mobile**: Full touch support for mobile devices

## Technical Details

Built following the project requirements below:

---

## Project Brief & Requirements: Interactive Canvas Fireworks


1. Executive Summary

This document outlines the research and requirements for developing a lightweight, high-performance, and visually engaging fireworks simulation using vanilla JavaScript and the HTML5 Canvas API. The primary goal is to create an immersive web experience that is both interactive and customizable, without relying on heavy external libraries.
The project will focus on four key pillars:
Lean Implementation: A from-scratch approach to ensure minimal footprint and maximum control.
Advanced Rendering: Utilizing techniques like additive blending to create realistic light and glow effects.
Audio-Visual Synchronization: Leveraging the Web Audio API for precisely timed sound effects that enhance immersion.
User Customization: Empowering users to define the characteristics of the fireworks, including their color, size, and explosion shape.

2. Core Requirements


2.1 Functional Requirements

Rendering Surface: The application must render a full-screen <canvas> element that dynamically resizes to fit the browser viewport.1
Firework Lifecycle: The simulation will model the complete lifecycle of a firework:
Launch: A rocket (the Firework object) launches from the bottom of the screen towards a target destination.3
Explosion: Upon reaching its target, the rocket explodes, generating a burst of multiple Particle objects.2
Particle Physics: Particles will follow a parabolic trajectory influenced by their initial velocity, simulated gravity, and air resistance (friction).1
Fade: Particles will gradually fade out and be removed from the simulation after their lifespan expires.2
User Interaction: The simulation will be interactive. A mouse click or touch event on the canvas will trigger the launch of a firework to that specific location.4
Audio Integration: The experience must include synchronized sound effects for both the firework launch (e.g., a "whoosh") and the explosion (e.g., a "boom").6
Customization: The system must provide a mechanism (via a configuration object or a simple UI) for users to customize the visual properties of the fireworks, including:
Color: Ability to define single colors, multiple colors, or color palettes for explosions.7
Size: Control over the size and scale of the explosion particles.7
Shape: Ability to define the geometric shape of the explosion burst (e.g., default sphere, star, heart).8

2.2 Non-Functional Requirements

Performance: The animation must maintain a smooth and consistent frame rate (targeting 60 FPS) by using efficient rendering techniques and optimized code.
Lean Architecture: The core implementation will use native browser APIs (Canvas 2D Context, Web Audio API) and vanilla JavaScript to minimize dependencies and keep the final bundle size small.1
Browser Compatibility: The application must function correctly on all modern, evergreen web browsers (Chrome, Firefox, Safari, Edge).
Responsiveness: The canvas and its contents must scale and adapt correctly to various screen sizes and resolutions.

3. Technical Specification & Research


3.1 Lean Implementation & Rendering Engine

The foundation of the project will be a minimal HTML structure containing a single <canvas> element styled to fill the viewport.1 The animation will be driven by a highly efficient, self-contained JavaScript engine.
Animation Loop: The core animation driver will be window.requestAnimationFrame(). This is superior to setInterval() as it synchronizes with the browser's repaint cycle, leading to smoother animations and improved performance by pausing when the tab is inactive.10
Particle System: An object-oriented approach will be used, with Firework and Particle classes encapsulating their respective properties (position, velocity, color, lifespan) and logic (update(), draw()).2
State Management: Two primary arrays, fireworks and particles, will hold all active objects. To safely remove objects as they expire, loops will iterate backward through these arrays.2

3.2 Rendering Optimization: Additive Blending

To achieve a convincing "glow" effect characteristic of real fireworks, the canvas rendering context will be configured for additive blending.
globalCompositeOperation: Before drawing the particles in each frame, the context's globalCompositeOperation will be set to 'lighter'.11 This mode causes the color values of overlapping pixels to be added together. Where multiple light-emitting particles overlap, the color will become brighter, culminating in a brilliant white at the core of the explosion. This single setting is critical for transforming flat circles into radiant bursts of light.
Trailing Effect: Instead of fully clearing the canvas each frame with clearRect(), we will draw a semi-transparent black rectangle over the entire canvas (fillStyle = 'rgba(0, 0, 0, 0.1)'). This technique creates a natural motion blur or "trailing" effect, as the light from previous frames fades out gradually rather than disappearing abruptly.3

3.3 Audio Synchronization with Synthesized Sound

To ensure a truly immersive experience, audio must be perfectly synchronized with the visuals. The Web Audio API is required for its low-latency, high-precision scheduling capabilities.12 Instead of loading pre-recorded audio files, all sound effects will be synthesized in real-time, providing a dynamic and lightweight solution.
Audio Synthesis Strategy: The core of the audio generation is the Web Audio API's modular routing graph.13 An AudioContext will serve as the main controller. Sounds will originate from source nodes (like OscillatorNode for tones or buffered noise) and be sculpted by passing them through a chain of effect nodes (like GainNode for volume and BiquadFilterNode for filtering) before reaching the final destination (the user's speakers).12
Synthesizing the Launch "Whoosh": The ascending whistle of the firework will be generated using an OscillatorNode.14 A rising pitch effect is created by scheduling a change to the oscillator's frequency AudioParam.
An oscillator is created with a starting frequency.
Using oscillator.frequency.linearRampToValueAtTime(), the frequency is scheduled to increase over the duration of the rocket's flight, simulating the Doppler effect of an object moving quickly towards the listener.16
Synthesizing the Explosion "Boom": The explosion sound will be generated by filtering white noise.15
Noise Source: A buffer of white noise is created by filling an AudioBuffer with random values. This buffer is then played using an AudioBufferSourceNode.19
Volume Envelope: A GainNode is used to shape the volume of the noise into a percussive "boom." This is achieved by creating a sharp attack and a quick exponential decay using methods like gain.gain.setValueAtTime() and gain.gain.exponentialRampToValueAtTime().14
Filtering: To add character and a "crackling" quality, the noise is passed through a BiquadFilterNode configured as a low-pass filter. The filter's frequency is quickly swept from a high to a low value, mimicking the sound of an explosion dissipating.21
Precise Scheduling: Synchronization is achieved by calculating the firework's flight duration.
When a firework is launched, the function to synthesize the "whoosh" sound is triggered immediately.
Simultaneously, the synthesis of the "explosion" sound is scheduled to begin at the precise future time of the explosion. All the necessary AudioParam changes (for gain and filter frequency) are scheduled to start at audioContext.currentTime + flightDuration.21 This method offloads timing to the browser's dedicated audio thread, guaranteeing the sound plays at the exact moment the visual explosion begins and eliminating perceptible lag.12

3.4 Firework Customization

The system will be designed to be highly extensible, allowing for easy customization of firework properties.
Color and Size: These will be properties of the Particle class. A configuration object will allow setting a specific color or an array of colors to be chosen randomly for each explosion. Particle size (radius) will also be configurable, with an optional random variance for a more organic look.7
Custom Explosion Shapes: To move beyond a simple spherical burst, particle velocities can be directed into geometric patterns. The implementation will involve:
Shape Definition: A shape (e.g., a heart or star) will be defined as a collection of 2D vector points.
Velocity Mapping: Upon explosion, instead of generating fully random velocity vectors for each particle, the system will map particles to the points defining the target shape. The initial velocity vector for each particle will be directed from the explosion's center to one of the points on the shape's perimeter.
Implementation: A function will take a shape identifier (e.g., 'star') and the number of particles, then return an array of initial velocity vectors that form that shape. This allows for a library of different explosion patterns to be created and selected by the user.8
Works cited
Celebrate the Fourth of July with JavaScript Fireworks! - Airbrake Docs, accessed on October 20, 2025, https://docs.airbrake.io/blog/javascript/fourth-of-july-javascript-fireworks/
Firework Animation, accessed on October 20, 2025, https://dlastcodebender.com.ng/firework-animation/
Make an explosive firework display - CreativeJS, accessed on October 20, 2025, http://creativejs.com/tutorials/creating-fireworks/index.html
Fireworks On Click | Javascript & Canvas - Coding Artist, accessed on October 20, 2025, https://codingartistweb.com/2022/10/fireworks-on-click-javascript-canvas/
Fireworks On Click | Javascript & Canvas Tutorial With Source Code - YouTube, accessed on October 20, 2025, https://www.youtube.com/watch?v=TGPCukDRhBk
Light Up Your Browser: Creating a Dazzling Fireworks Display with JavaScript and Canvas, accessed on October 20, 2025, https://dev.to/best_codes/light-up-your-browser-creating-a-dazzling-fireworks-display-with-javascript-and-canvas-8fg
HTML Canvas Fireworks - DEV Community, accessed on October 20, 2025, https://dev.to/nicm42/html-canvas-fireworks-40e1
zarocknz/javascript-skyrocket: Design and Display fireworks on HTML canvas with Skyrocket.js - GitHub, accessed on October 20, 2025, https://github.com/zarocknz/javascript-skyrocket
Animate Fireworks with JavaScript and Canvas - Codédex, accessed on October 20, 2025, https://www.codedex.io/projects/animate-fireworks-with-javascript-and-canvas
HTML5 canvas and javascript fireworks tutorial - CodePen, accessed on October 20, 2025, https://codepen.io/whqet/pen/Auzch
Make a particle system in HTML5 canvas - The Code Player, accessed on October 20, 2025, https://thecodeplayer.com/walkthrough/make-a-particle-system-in-html5-canvas
Web Audio API - MDN - Mozilla, accessed on October 20, 2025, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
Using the Web Audio API - MDN, accessed on October 20, 2025, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
Synthesising Sounds with Web Audio API -, accessed on October 20, 2025, https://sonoport.github.io/synthesising-sounds-webaudio.html
Advanced techniques: Creating and sequencing audio - Web APIs - MDN, accessed on October 20, 2025, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
How to change oscillator frequency? - javascript - Stack Overflow, accessed on October 20, 2025, https://stackoverflow.com/questions/40291462/how-to-change-oscillator-frequency
AudioParam: exponentialRampToValueAtTime() method - Web APIs ..., accessed on October 20, 2025, https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
Procedurally Generated Gunshot Sounds in the Web Audio API : r/proceduralgeneration - Reddit, accessed on October 20, 2025, https://www.reddit.com/r/proceduralgeneration/comments/4r1sxq/procedurally_generated_gunshot_sounds_in_the_web/
How to Generate Noise with the Web Audio API - Noisehack, accessed on October 20, 2025, https://noisehack.com/generate-noise-web-audio-api/
GainNode | React Native Audio API, accessed on October 20, 2025, https://docs.swmansion.com/react-native-audio-api/docs/effects/gain-node/
Getting started with Web Audio API | Articles - web.dev, accessed on October 20, 2025, https://web.dev/articles/webaudio-intro
