const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

const inputLogo = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate regular icons
    for (const size of iconSizes) {
      await sharp(inputLogo)
        .resize(size, size)
        .png({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Generate maskable icons (with safe zone)
    for (const size of maskableSizes) {
      const safeZone = Math.floor(size * 0.8); // 80% safe zone for maskable icons
      const padding = (size - safeZone) / 2;
      
      await sharp(inputLogo)
        .resize(safeZone, safeZone)
        .extend({
          top: Math.floor(padding),
          left: Math.floor(padding),
          bottom: Math.ceil(padding),
          right: Math.ceil(padding),
          background: { r: 37, g: 99, b: 235, alpha: 1 } // theme_color #2563eb
        })
        .png()
        .toFile(path.join(outputDir, `icon-maskable-${size}x${size}.png`));
      console.log(`Generated icon-maskable-${size}x${size}.png`);
    }

    console.log('All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
