/**
 * Generate Office Add-in icons from logo.svg
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const toIco = require('to-ico');
const { execSync } = require('child_process');

const sizes = [16, 32, 64, 80, 128, 256, 512, 1024];
const inputFile = path.resolve(__dirname, '../logo.svg');
const outputDir = path.resolve(__dirname, '../src/ui/public');
const installerDir = path.resolve(__dirname, '../installer/windows');
const macInstallerDir = path.resolve(__dirname, '../installer/macos');
const assetsDir = path.resolve(__dirname, '../assets');

async function generateIcons() {
  // Ensure output directories exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating icons from logo.svg...');

  const pngPaths = [];
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}.png`);
    
    await sharp(inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFile);
    
    console.log(`  ✓ icon-${size}.png`);
    pngPaths.push(outputFile);
  }

  console.log(`\nPNG icons saved to: ${outputDir}`);

  // Generate Windows .ico file (contains multiple sizes)
  console.log('\nGenerating Windows .ico file...');
  try {
    const icoSizes = [16, 32, 64, 128, 256];
    const pngBuffers = icoSizes.map(s => fs.readFileSync(path.join(outputDir, `icon-${s}.png`)));
    const icoBuffer = await toIco(pngBuffers);
    const icoPath = path.join(installerDir, 'app.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`  ✓ app.ico saved to: ${icoPath}`);
    
    // Also save to assets for tray icon
    const trayIcoPath = path.join(assetsDir, 'tray-icon.ico');
    fs.writeFileSync(trayIcoPath, icoBuffer);
    console.log(`  ✓ tray-icon.ico saved to: ${trayIcoPath}`);
  } catch (err) {
    console.log(`  ⚠ Could not generate .ico: ${err.message}`);
  }

  // Copy icon for macOS installer (uses PNG)
  const macosInstallerIcon = path.join(macInstallerDir, 'icon.png');
  fs.copyFileSync(path.join(outputDir, 'icon-256.png'), macosInstallerIcon);
  console.log(`  ✓ icon.png copied to: ${macosInstallerIcon}`);

  // Generate macOS .icns file (requires iconutil on macOS)
  console.log('\nGenerating macOS .icns file...');
  if (process.platform === 'darwin') {
    try {
      const iconsetDir = path.join(macInstallerDir, 'icon.iconset');
      if (!fs.existsSync(iconsetDir)) {
        fs.mkdirSync(iconsetDir, { recursive: true });
      }

      // macOS iconset requires specific naming: icon_NxN.png and icon_NxN@2x.png
      const iconsetSizes = [
        { name: 'icon_16x16.png', size: 16 },
        { name: 'icon_16x16@2x.png', size: 32 },
        { name: 'icon_32x32.png', size: 32 },
        { name: 'icon_32x32@2x.png', size: 64 },
        { name: 'icon_128x128.png', size: 128 },
        { name: 'icon_128x128@2x.png', size: 256 },
        { name: 'icon_256x256.png', size: 256 },
        { name: 'icon_256x256@2x.png', size: 512 },
        { name: 'icon_512x512.png', size: 512 },
        { name: 'icon_512x512@2x.png', size: 1024 },
      ];

      for (const { name, size } of iconsetSizes) {
        const srcFile = path.join(outputDir, `icon-${size}.png`);
        const destFile = path.join(iconsetDir, name);
        fs.copyFileSync(srcFile, destFile);
      }

      // Use iconutil to create .icns
      const icnsPath = path.join(macInstallerDir, 'icon.icns');
      execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
      console.log(`  ✓ icon.icns saved to: ${icnsPath}`);

      // Clean up iconset directory
      fs.rmSync(iconsetDir, { recursive: true });
    } catch (err) {
      console.log(`  ⚠ Could not generate .icns: ${err.message}`);
      console.log('    (This only works on macOS with iconutil installed)');
    }
  } else {
    console.log('  ⚠ Skipping .icns generation (only works on macOS)');
  }

  // Generate tray icons for macOS (Template images)
  console.log('\nGenerating tray icons...');
  try {
    // macOS tray icons should be 16x16 and 32x32 (for @2x)
    // Template images should be black with alpha for proper menu bar appearance
    const trayIcon16 = path.join(assetsDir, 'tray-iconTemplate.png');
    const trayIcon32 = path.join(assetsDir, 'tray-iconTemplate@2x.png');
    
    // For template icons, we need to convert to grayscale/black
    await sharp(inputFile)
      .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .grayscale()
      .png()
      .toFile(trayIcon16);
    console.log(`  ✓ tray-iconTemplate.png`);

    await sharp(inputFile)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .grayscale()
      .png()
      .toFile(trayIcon32);
    console.log(`  ✓ tray-iconTemplate@2x.png`);
  } catch (err) {
    console.log(`  ⚠ Could not generate tray icons: ${err.message}`);
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
