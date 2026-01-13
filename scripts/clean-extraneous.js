/**
 * Clean up extraneous packages that shouldn't be bundled
 * Run: node scripts/clean-extraneous.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagesToRemove = [
  'office-addin-dev-certs',
  'office-addin-cli',
  'office-addin-usage-data',
  'npm-normalize-package-bin',
  'read-package-json-fast'
];

console.log('Cleaning extraneous packages...');

// Run npm prune first
try {
  console.log('Running npm prune...');
  execSync('npm prune', { stdio: 'inherit' });
} catch (err) {
  console.log('npm prune completed with warnings (this is usually fine)');
}

// Remove each package manually if it still exists
const nodeModulesPath = path.resolve(__dirname, '../node_modules');

for (const pkg of packagesToRemove) {
  const pkgPath = path.join(nodeModulesPath, pkg);
  if (fs.existsSync(pkgPath)) {
    console.log(`Removing ${pkg}...`);
    try {
      fs.rmSync(pkgPath, { recursive: true, force: true });
      console.log(`  ✓ Removed ${pkg}`);
    } catch (err) {
      console.log(`  ⚠ Could not remove ${pkg}: ${err.message}`);
    }
  }
}

console.log('Done cleaning extraneous packages.');
