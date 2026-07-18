const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Detect if running inside the pnpm monorepo (Replit dev) or standalone (EAS)
const isMonorepo = fs.existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'));

// ─── Config ──────────────────────────────────────────────────────────────────
const config = getDefaultConfig(projectRoot);

if (isMonorepo) {
  // ─── pnpm canonical paths ─────────────────────────────────────────────────
  // pnpm hoists shared packages into .pnpm/node_modules so they are deduped.
  const pnpmHoist = path.join(workspaceRoot, 'node_modules/.pnpm/node_modules');

  function realPkg(name) {
    const hoisted = path.join(pnpmHoist, name);
    try {
      return fs.realpathSync(hoisted);
    } catch (_) {
      return hoisted;
    }
  }

  // Watch the entire monorepo so Metro can follow pnpm symlinks.
  config.watchFolders = [workspaceRoot];

  // Resolution order: artifact → workspace root → pnpm hoist
  config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
    pnpmHoist,
  ];

  // ─── THE FIX: force all @firebase/* to one canonical directory ─────────────
  config.resolver.extraNodeModules = {
    '@firebase/app':       realPkg('@firebase/app'),
    '@firebase/auth':      realPkg('@firebase/auth'),
    '@firebase/component': realPkg('@firebase/component'),
    '@firebase/util':      realPkg('@firebase/util'),
    '@firebase/logger':    realPkg('@firebase/logger'),
  };
} else {
  // EAS Build: standalone, all node_modules inside project directory
  config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
  ];
}

// ─── Block @firebase/auth temp build dirs ─────────────────────────────────────
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
