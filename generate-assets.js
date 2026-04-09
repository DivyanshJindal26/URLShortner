/**
 * Generates mobile/assets/*.png from SVG definitions.
 * Run once: node generate-assets.js
 * Requires: npm install sharp   (in the root folder)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'mobile', 'assets');
fs.mkdirSync(OUT, { recursive: true });

// ─── SVG Definitions ──────────────────────────────────────────────────────────

// App icon — 1024x1024
// Dark bg + interlocked chain links using SVG mask for clean overlap
const chainLinkDefs = `
  <defs>
    <!-- Mask: hide portion of right link where left link passes in front -->
    <mask id="m">
      <rect width="1024" height="1024" fill="white"/>
      <!-- Black = hidden: the body of the left link occludes part of right link -->
      <rect x="186" y="370" width="348" height="144" rx="72" fill="black"/>
    </mask>
  </defs>`;

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="224" fill="#0f0f0f"/>
  ${chainLinkDefs}
  <!-- Right link (behind) — masked where left link crosses in front -->
  <rect x="452" y="472" width="424" height="220" rx="110"
        fill="none" stroke="#818cf8" stroke-width="76" mask="url(#m)"/>
  <!-- Left link (in front) -->
  <rect x="148" y="332" width="424" height="220" rx="110"
        fill="none" stroke="#6366f1" stroke-width="76"/>
</svg>`;

// Adaptive icon — same but square bg (Android clips the shape)
const adaptiveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0f0f0f"/>
  ${chainLinkDefs}
  <rect x="452" y="472" width="424" height="220" rx="110"
        fill="none" stroke="#818cf8" stroke-width="76" mask="url(#m)"/>
  <rect x="148" y="332" width="424" height="220" rx="110"
        fill="none" stroke="#6366f1" stroke-width="76"/>
</svg>`;

// Widget preview — 320x160
const widgetSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">
  <rect width="320" height="160" rx="20" fill="#1a1a1a"/>

  <!-- Title -->
  <text x="16" y="28" font-family="system-ui, sans-serif" font-size="11"
        font-weight="700" fill="#6366f1">softkernel.in</text>

  <!-- Shorten button -->
  <rect x="12" y="40" width="140" height="108" rx="12" fill="#6366f1"/>
  <text x="82" y="90" font-family="system-ui, sans-serif" font-size="22"
        text-anchor="middle" fill="white">🔗</text>
  <text x="82" y="116" font-family="system-ui, sans-serif" font-size="13"
        font-weight="600" text-anchor="middle" fill="white">Shorten</text>

  <!-- Upload button -->
  <rect x="168" y="40" width="140" height="108" rx="12" fill="#2a2a2a"/>
  <text x="238" y="90" font-family="system-ui, sans-serif" font-size="22"
        text-anchor="middle" fill="#e5e5e5">📷</text>
  <text x="238" y="116" font-family="system-ui, sans-serif" font-size="13"
        font-weight="600" text-anchor="middle" fill="#e5e5e5">Upload</text>
</svg>`;

// ─── Render ───────────────────────────────────────────────────────────────────

async function render(svgString, outFile, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toFile(outFile);
  console.log('✓', path.relative(__dirname, outFile));
}

(async () => {
  await render(iconSvg,     path.join(OUT, 'icon.png'),           1024, 1024);
  await render(adaptiveSvg, path.join(OUT, 'adaptive-icon.png'),  1024, 1024);
  await render(widgetSvg,   path.join(OUT, 'widget-preview.png'),  320,  160);
  console.log('\nAssets written to mobile/assets/');
})().catch(err => {
  console.error('Error:', err.message);
  console.error('Make sure to run: npm install sharp');
  process.exit(1);
});
