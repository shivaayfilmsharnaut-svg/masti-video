const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// ─── pnpm canonical paths ─────────────────────────────────────────────────────
// pnpm hoists shared packages into .pnpm/node_modules so they are deduped.
// We resolve their real (symlink-free) paths here once, then force Metro to use
// them for every require() call via extraNodeModules.
const pnpmHoist = path.join(workspaceRoot, 'node_modules/.pnpm/node_modules');

function realPkg(name) {
  const hoisted = path.join(pnpmHoist, name);
  try {
    return fs.realpathSync(hoisted);
  } catch (_) {
    return hoisted;
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────
const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro can follow pnpm symlinks.
config.watchFolders = [workspaceRoot];

// Resolution order: artifact → workspace root → pnpm hoist
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
  pnpmHoist,
];

// ─── THE FIX: force all @firebase/* to one canonical directory ────────────────
// Root cause of "Component auth has not been registered yet":
//   pnpm creates many symlink aliases to the same @firebase/app files.
//   Metro treats each symlink path as a separate JS module → separate registries
//   → auth registered in registry A, app created in registry B → mismatch.
//
// extraNodeModules overrides ALL module resolution regardless of caller location,
// so every require('@firebase/app') in every file gets the identical real path.
config.resolver.extraNodeModules = {
  '@firebase/app':       realPkg('@firebase/app'),
  '@firebase/auth':      realPkg('@firebase/auth'),
  '@firebase/component': realPkg('@firebase/component'),
  '@firebase/util':      realPkg('@firebase/util'),
  '@firebase/logger':    realPkg('@firebase/logger'),
};

// ─── Block @firebase/auth temp build dirs created during pnpm install ─────────
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
    ? [existingBlockList]
    : []),
  /node_modules[/\\].*_tmp_\d+[/\\].*/,
];

module.exports = config;
