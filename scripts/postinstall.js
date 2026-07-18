/**
 * postinstall.js — patches expo-firebase-core to be compatible with
 * modern expo-modules-core (Expo SDK 50+).
 */
try {
  const fs = require('fs');
  const path = require('path');

  const BASE = path.join(__dirname, '..', 'node_modules', 'expo-firebase-core');
  const ANDROID_SRC = path.join(BASE, 'android', 'src', 'main', 'java', 'expo', 'modules', 'firebase', 'core');
  const BUILD_GRADLE = path.join(BASE, 'android', 'build.gradle');

  if (!fs.existsSync(BUILD_GRADLE)) {
    console.log('[postinstall] expo-firebase-core not found — skipping.');
    process.exit(0);
  }

  // ─── 1. Patch build.gradle ─────────────────────────────────────────────────
  let content = fs.readFileSync(BUILD_GRADLE, 'utf8');
  const orig = content;
  content = content.replace(/\bclassifier\s*=\s*'sources'/g, "archiveClassifier = 'sources'");
  content = content.replace(
    /compileSdkVersion\s+safeExtGet\("compileSdkVersion",\s*\d+\)/g,
    'compileSdk safeExtGet("compileSdkVersion", 35)'
  );
  content = content.replace(
    /targetSdkVersion\s+safeExtGet\("targetSdkVersion",\s*\d+\)/g,
    'targetSdkVersion safeExtGet("targetSdkVersion", 35)'
  );
  if (content !== orig) {
    fs.writeFileSync(BUILD_GRADLE, content, 'utf8');
    console.log('[postinstall] expo-firebase-core: build.gradle patched.');
  }

  // ─── 2. Stub broken Java source files ──────────────────────────────────────
  const stubs = {
    'FirebaseCoreModule.java': `package expo.modules.firebase.core;

import android.content.Context;

// Stubbed for expo-modules-core compatibility (ExportedModule removed in SDK 50+)
public class FirebaseCoreModule {
  private static final String NAME = "ExpoFirebaseCore";
  public FirebaseCoreModule(Context context) {}
  public String getName() { return NAME; }
}
`,
    'FirebaseCorePackage.java': `package expo.modules.firebase.core;

import android.content.Context;
import java.util.Collections;
import java.util.List;

// Stubbed for expo-modules-core compatibility (BasePackage / ExportedModule removed in SDK 50+)
public class FirebaseCorePackage {
  public List<Object> createInternalModules(Context context) {
    return Collections.emptyList();
  }
  public List<Object> createExportedModules(Context context) {
    return Collections.emptyList();
  }
}
`,
  };

  if (!fs.existsSync(ANDROID_SRC)) {
    console.log('[postinstall] expo-firebase-core Java src not found — skipping stub.');
    process.exit(0);
  }

  for (const [filename, src] of Object.entries(stubs)) {
    const filePath = path.join(ANDROID_SRC, filename);
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, 'utf8');
      if (existing !== src) {
        fs.writeFileSync(filePath, src, 'utf8');
        console.log('[postinstall] expo-firebase-core: stubbed ' + filename);
      }
    }
  }

  console.log('[postinstall] expo-firebase-core patches applied.');
} catch (err) {
  console.warn('[postinstall] Warning: patch failed (non-fatal):', err.message);
  // Do NOT exit with non-zero — let the install succeed
}
