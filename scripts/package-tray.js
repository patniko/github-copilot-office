#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const platform = os.platform();
const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, 'build', 'tray-package');
const version = require(path.join(projectRoot, 'package.json')).version;

// Clean and create build directory
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

console.log(`Packaging tray app for ${platform}...`);

// Build the app first
console.log('Building app...');
execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });

// Files to include in the package
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'manifest.xml',
  'GETTING_STARTED.md',
];

const dirsToCopy = [
  'src',
  'dist',
  'certs',
  'assets',
];

// Copy files
for (const file of filesToCopy) {
  const src = path.join(projectRoot, file);
  const dest = path.join(buildDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
}

// Copy directories
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const dir of dirsToCopy) {
  const src = path.join(projectRoot, dir);
  const dest = path.join(buildDir, dir);
  if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log(`Copied ${dir}/`);
  }
}

// Copy platform-specific scripts
if (platform === 'darwin') {
  fs.copyFileSync(
    path.join(projectRoot, 'register.sh'),
    path.join(buildDir, 'register.sh')
  );
  fs.copyFileSync(
    path.join(projectRoot, 'unregister.sh'),
    path.join(buildDir, 'unregister.sh')
  );
  // Make scripts executable
  fs.chmodSync(path.join(buildDir, 'register.sh'), 0o755);
  fs.chmodSync(path.join(buildDir, 'unregister.sh'), 0o755);
  console.log('Copied register.sh and unregister.sh');
} else if (platform === 'win32') {
  fs.copyFileSync(
    path.join(projectRoot, 'register.ps1'),
    path.join(buildDir, 'register.ps1')
  );
  fs.copyFileSync(
    path.join(projectRoot, 'unregister.ps1'),
    path.join(buildDir, 'unregister.ps1')
  );
  console.log('Copied register.ps1 and unregister.ps1');
}

// Create the zip
const zipName = platform === 'darwin' 
  ? `copilot-office-addin-macos-v${version}.zip`
  : `copilot-office-addin-windows-v${version}.zip`;
const zipPath = path.join(projectRoot, 'build', zipName);

console.log(`Creating ${zipName}...`);

if (platform === 'darwin') {
  execSync(`cd "${buildDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
} else if (platform === 'win32') {
  execSync(
    `powershell -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' }
  );
}

console.log(`\nPackage created: build/${zipName}`);
