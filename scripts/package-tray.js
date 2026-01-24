#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const platform = os.platform();
const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, 'build', 'tray-package');
const electronDir = path.join(projectRoot, 'build', 'electron');
const version = require(path.join(projectRoot, 'package.json')).version;

// Clean and create build directory
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

console.log(`Packaging tray app for ${platform}...`);

// Build the Electron app with electron-builder (creates unpacked app)
console.log('Building Electron app...');
if (platform === 'darwin') {
  execSync('npm run build:installer:mac', { cwd: projectRoot, stdio: 'inherit' });
} else if (platform === 'win32') {
  execSync('npm run build:installer:win', { cwd: projectRoot, stdio: 'inherit' });
}

// Copy the built app
if (platform === 'darwin') {
  const appName = 'GitHub Copilot Office Add-in.app';
  const macUnpackedDir = path.join(electronDir, 'mac');
  const macArmUnpackedDir = path.join(electronDir, 'mac-arm64');
  
  // Check for arm64 or intel mac build
  let sourceApp;
  if (fs.existsSync(macArmUnpackedDir)) {
    sourceApp = path.join(macArmUnpackedDir, appName);
  } else if (fs.existsSync(macUnpackedDir)) {
    sourceApp = path.join(macUnpackedDir, appName);
  }
  
  if (sourceApp && fs.existsSync(sourceApp)) {
    console.log(`Copying ${appName}...`);
    execSync(`cp -R "${sourceApp}" "${buildDir}/"`, { stdio: 'inherit' });
  } else {
    console.error('Could not find built macOS app');
    process.exit(1);
  }
  
  // Copy register script
  fs.copyFileSync(
    path.join(projectRoot, 'register.sh'),
    path.join(buildDir, 'register.sh')
  );
  fs.chmodSync(path.join(buildDir, 'register.sh'), 0o755);
  console.log('Copied register.sh');
  
} else if (platform === 'win32') {
  const winUnpackedDir = path.join(electronDir, 'win-unpacked');
  
  if (fs.existsSync(winUnpackedDir)) {
    console.log('Copying Windows app...');
    // Copy the entire win-unpacked folder contents
    execSync(`xcopy "${winUnpackedDir}\\*" "${buildDir}\\" /E /I /Y`, { stdio: 'inherit' });
  } else {
    console.error('Could not find built Windows app');
    process.exit(1);
  }
  
  // Copy register script
  fs.copyFileSync(
    path.join(projectRoot, 'register.ps1'),
    path.join(buildDir, 'register.ps1')
  );
  console.log('Copied register.ps1');
}

// Copy GETTING_STARTED.md
fs.copyFileSync(
  path.join(projectRoot, 'GETTING_STARTED.md'),
  path.join(buildDir, 'GETTING_STARTED.md')
);
console.log('Copied GETTING_STARTED.md');

// Create the zip
const zipName = platform === 'darwin' 
  ? `copilot-office-addin-macos-v${version}.zip`
  : `copilot-office-addin-windows-v${version}.zip`;
const zipPath = path.join(projectRoot, 'build', zipName);

// Remove existing zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`Creating ${zipName}...`);

if (platform === 'darwin') {
  execSync(`cd "${buildDir}" && zip -r -y "${zipPath}" .`, { stdio: 'inherit' });
} else if (platform === 'win32') {
  execSync(
    `powershell -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' }
  );
}

console.log(`\nPackage created: build/${zipName}`);
