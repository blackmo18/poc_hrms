const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  try {
    const inputLogo = path.join(__dirname, '../public/images/logo/logo-icon.svg');
    const outputFavicon = path.join(__dirname, '../public/favicon.ico');

    // Generate a 32x32 favicon
    await sharp(inputLogo)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon-temp.png'));

    // For now, we'll use the PNG as favicon (browsers support PNG favicons)
    // You can convert to .ico using an online tool if needed
    console.log('Generated favicon-temp.png (32x32)');
    console.log('Note: Consider converting to .ico format for older browsers');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon();
