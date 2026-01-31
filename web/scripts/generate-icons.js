const sharp = require('sharp');
const path = require('path');

const sourceIcon = path.join(__dirname, '../src/assets/images/appIcon.png');
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating PWA icons from:', sourceIcon);

  await sharp(sourceIcon).resize(192, 192).png().toFile(path.join(publicDir, 'logo192.png'));
  console.log('✓ Created logo192.png');

  await sharp(sourceIcon).resize(512, 512).png().toFile(path.join(publicDir, 'logo512.png'));
  console.log('✓ Created logo512.png');

  await sharp(sourceIcon).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  await sharp(sourceIcon).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicon.ico');

  console.log('\nAll icons generated!');
}

generateIcons().catch(console.error);