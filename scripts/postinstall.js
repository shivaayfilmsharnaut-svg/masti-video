/**
 * postinstall.js — patches expo-firebase-core to be compatible with
 * modern expo-modules-core (Expo SDK 50+).
 *
 * expo-firebase-core@6.0.0 references ExportedModule / BasePackage /
 * ModuleRegistry which were removed from expo-modules-core. This script
 * replaces the incompatible Android Java files with stubs that compile
 * cleanly, while leaving the JS / web side of expo-firebase-recaptcha
 * fully functional.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'node_modules', 'expo-firebase-core');
const ANDROID_SRC = path.join(BASE, 'android', 'src', 'main', 'java', 'expo', 'modules', 'firebase', 'core');
const BUILD_GRADLE = path.join(BASE, 'android', 'build.gradle');

// ─── 1. Patch build.gradle ────────────────────────────────────────────────────
if (fs.existsSync(BUILD_GRADLE)) {
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
} else {
  console.log('[postinstall] expo-firebase-core not found — skipping.');
  process.exit(0);
}

// ─── 2. Stub broken Java source files ────────────────────────────────────────
// These stubs compile with any version of expo-modules-core because they
// remove the dependency on the long-removed ExportedModule / BasePackage API.

const stubs = {
  'FirebaseCoreModule.java': `\
package expo.modules.firebase.core;

import android.content.Context;

// Stubbed for expo-modules-core compatibility (ExportedModule removed in SDK 50+)
public class FirebaseCoreModule {
  private static final String NAME = "ExpoFirebaseCore";
  public FirebaseCoreModule(Context context) {}
  public String getName() { return NAME; }
}
`,
  'FirebaseCorePackage.java': `\
package expo.modules.firebase.core;

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
