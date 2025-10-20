// Simple Node.js script to create OG image using canvas
const fs = require('fs');

// Create a simple SVG as placeholder
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#000428;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#004e92;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Stars -->
  <circle cx="100" cy="50" r="2" fill="white" opacity="0.8"/>
  <circle cx="300" cy="80" r="1.5" fill="white" opacity="0.6"/>
  <circle cx="500" cy="40" r="2" fill="white" opacity="0.9"/>
  <circle cx="700" cy="90" r="1" fill="white" opacity="0.7"/>
  <circle cx="900" cy="60" r="2" fill="white" opacity="0.8"/>
  <circle cx="1100" cy="70" r="1.5" fill="white" opacity="0.6"/>
  <circle cx="200" cy="120" r="1" fill="white" opacity="0.5"/>
  <circle cx="400" cy="100" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="600" cy="110" r="2" fill="white" opacity="0.8"/>
  <circle cx="800" cy="50" r="1" fill="white" opacity="0.6"/>
  <circle cx="1000" cy="130" r="1.5" fill="white" opacity="0.7"/>
  
  <!-- Firework bursts -->
  <g opacity="0.9">
    <!-- Red firework -->
    <circle cx="300" cy="200" r="60" fill="none" stroke="#ff3300" stroke-width="2" opacity="0.6"/>
    <circle cx="300" cy="200" r="40" fill="none" stroke="#ff6600" stroke-width="3" opacity="0.8"/>
    <circle cx="300" cy="200" r="20" fill="#ff9900" opacity="0.9"/>
    
    <!-- Blue firework -->
    <circle cx="600" cy="150" r="80" fill="none" stroke="#00ccff" stroke-width="2" opacity="0.6"/>
    <circle cx="600" cy="150" r="50" fill="none" stroke="#0099ff" stroke-width="3" opacity="0.8"/>
    <circle cx="600" cy="150" r="25" fill="#00ffff" opacity="0.9"/>
    
    <!-- Yellow firework -->
    <circle cx="900" cy="250" r="70" fill="none" stroke="#ffcc00" stroke-width="2" opacity="0.6"/>
    <circle cx="900" cy="250" r="45" fill="none" stroke="#ffff00" stroke-width="3" opacity="0.8"/>
    <circle cx="900" cy="250" r="22" fill="#ffff99" opacity="0.9"/>
    
    <!-- Purple firework -->
    <circle cx="450" cy="400" r="55" fill="none" stroke="#cc00ff" stroke-width="2" opacity="0.6"/>
    <circle cx="450" cy="400" r="35" fill="none" stroke="#ff00ff" stroke-width="3" opacity="0.8"/>
    <circle cx="450" cy="400" r="18" fill="#ff99ff" opacity="0.9"/>
    
    <!-- Green firework -->
    <circle cx="800" cy="380" r="65" fill="none" stroke="#00ff66" stroke-width="2" opacity="0.6"/>
    <circle cx="800" cy="380" r="42" fill="none" stroke="#33ff99" stroke-width="3" opacity="0.8"/>
    <circle cx="800" cy="380" r="20" fill="#99ffcc" opacity="0.9"/>
  </g>
  
  <!-- Title -->
  <text x="600" y="480" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
        fill="white" text-anchor="middle" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8))">
    Kaaro Fireworks
  </text>
  
  <!-- Subtitle -->
  <text x="600" y="540" font-family="Arial, sans-serif" font-size="32" 
        fill="#cccccc" text-anchor="middle">
    Interactive Canvas Fireworks Experience
  </text>
  
  <!-- Features -->
  <text x="600" y="590" font-family="Arial, sans-serif" font-size="24" 
        fill="#aaaaaa" text-anchor="middle">
    ✨ Custom Shapes • 🎵 Immersive Audio • 📱 Mobile Optimized
  </text>
</svg>`;

fs.writeFileSync('og-image.svg', svg);
console.log('Created og-image.svg');
