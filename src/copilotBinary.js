/*---------------------------------------------------------------------------------------------
 *  Resolves the GitHub Copilot CLI native binary.
 *
 *  As of @github/copilot v1.x the npm package no longer ships a JavaScript bundle
 *  (the old `@github/copilot/index.js`). It is a thin loader whose real payload lives
 *  in a platform-specific optional dependency, e.g. `@github/copilot-darwin-arm64`,
 *  which contains a self-contained native executable named `copilot`.
 *--------------------------------------------------------------------------------------------*/

const fs = require('fs');
const path = require('path');

/**
 * Candidate platform package suffixes for the current host, in priority order.
 * Linux may be glibc or musl, so musl builds are probed first when detected.
 */
function platformSuffixes() {
  const arch = process.arch;

  if (process.platform === 'linux') {
    let isMusl = false;
    try {
      isMusl = require('detect-libc').isNonGlibcLinuxSync();
    } catch {
      // detect-libc is an optional transitive dep; assume glibc when unavailable.
    }
    return isMusl
      ? [`linuxmusl-${arch}`, `linux-${arch}`]
      : [`linux-${arch}`];
  }

  return [`${process.platform}-${arch}`];
}

/**
 * Directories to search for the platform package. Under a packaged Electron app the
 * binary is unpacked alongside the asar, so `app.asar.unpacked` must be probed too.
 */
function searchRoots() {
  const roots = [path.resolve(__dirname, '..', 'node_modules')];

  // When running from inside an asar, also look in the unpacked sibling directory.
  const unpacked = roots[0].replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
  if (unpacked !== roots[0]) {
    roots.push(unpacked);
  }

  if (process.resourcesPath) {
    roots.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules'));
    roots.push(path.join(process.resourcesPath, 'node_modules'));
  }

  return roots;
}

/**
 * Absolute path to the Copilot CLI native executable.
 * @returns {string}
 * @throws {Error} when no platform package is installed for this host.
 */
function resolveCopilotBinary() {
  const exe = process.platform === 'win32' ? 'copilot.exe' : 'copilot';
  const attempted = [];

  for (const root of searchRoots()) {
    for (const suffix of platformSuffixes()) {
      const candidate = path.join(root, '@github', `copilot-${suffix}`, exe);
      attempted.push(candidate);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(
    `GitHub Copilot CLI binary not found for ${process.platform}-${process.arch}. ` +
    `Reinstall dependencies so the '@github/copilot-${platformSuffixes()[0]}' package is fetched. ` +
    `Searched:\n  ${attempted.join('\n  ')}`
  );
}

/**
 * Absolute path to the platform package's bundled SDK type declarations, used to
 * enumerate supported models without starting the runtime.
 * @returns {string|null}
 */
function resolveCopilotSdkTypes() {
  for (const root of searchRoots()) {
    for (const suffix of platformSuffixes()) {
      const candidate = path.join(root, '@github', `copilot-${suffix}`, 'sdk', 'index.d.ts');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

module.exports = { resolveCopilotBinary, resolveCopilotSdkTypes };
