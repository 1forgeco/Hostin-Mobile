const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
let appliedPatches = 0;

function patchFile(filePath, before, after, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`[postinstall] ${label} is not installed; skipping.`);
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes(before)) {
    fs.writeFileSync(filePath, source.replaceAll(before, after));
    appliedPatches += 1;
    console.log(`[postinstall] Applied ${label}.`);
  } else if (!source.includes(after)) {
    console.warn(`[postinstall] ${label} did not match the expected package source; skipping.`);
  }
}

const jsiPackageRoot = path.join(projectRoot, 'node_modules', 'expo-modules-jsi');
const headerPath = path.join(
  jsiPackageRoot,
  'apple',
  'Sources',
  'ExpoModulesJSI-Cxx',
  'include',
  'RuntimeScheduler.h'
);
patchFile(
  headerPath,
  'SWIFT_RETURNS_RETAINED RuntimeScheduler',
  'RuntimeScheduler',
  'expo-modules-jsi Xcode 26 Swift C++ compatibility patch'
);

const constantsRoot = path.join(projectRoot, 'node_modules', 'expo-constants');
patchFile(
  path.join(constantsRoot, 'ios', 'EXConstants.podspec'),
  ':script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
  ':script => "bash -l -c \\"#{env_vars}\\\\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\\\\"\\"",',
  'expo-constants CocoaPods path-with-spaces patch'
);
patchFile(
  path.join(constantsRoot, 'scripts', 'get-app-config-ios.sh'),
  'PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)',
  'PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")',
  'expo-constants project-directory quoting patch'
);

if (appliedPatches === 0) {
  console.log('[postinstall] Expo Xcode compatibility patches are already applied or no longer needed.');
}
