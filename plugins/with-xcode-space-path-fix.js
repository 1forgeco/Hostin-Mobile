const { withXcodeProject } = require('expo/config-plugins');

const BUNDLE_PHASE_NAME = 'Bundle React Native code and images';

module.exports = function withXcodeSpacePathFix(config) {
  return withXcodeProject(config, config => {
    const phases = config.modResults.hash.project.objects.PBXShellScriptBuildPhase;

    for (const phase of Object.values(phases)) {
      if (!phase || typeof phase !== 'object' || typeof phase.shellScript !== 'string') {
        continue;
      }

      const name = String(phase.name || '').replaceAll('"', '');
      if (name !== BUNDLE_PHASE_NAME) {
        continue;
      }

      const markerIndex = phase.shellScript.indexOf('react-native-xcode.sh');
      const commandStart = phase.shellScript.lastIndexOf('`', markerIndex);
      const commandEnd = phase.shellScript.indexOf('`', markerIndex);

      if (markerIndex >= 0 && commandStart >= 0 && commandEnd > commandStart) {
        const command = phase.shellScript.slice(commandStart + 1, commandEnd);
        phase.shellScript =
          phase.shellScript.slice(0, commandStart) +
          `\\"$(${command})\\"` +
          phase.shellScript.slice(commandEnd + 1);
      }
    }

    return config;
  });
};
