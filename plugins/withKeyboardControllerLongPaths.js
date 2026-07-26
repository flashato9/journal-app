// Windows-only (no-op on macOS/Linux, including CI) CMake fix for
// react-native-keyboard-controller's long build paths exceeding the
// 260-character MAX_PATH limit. Requires the SDK's cmake/3.22.1/bin/ninja.exe
// to already be replaced with ninja 1.12+ (the bundled 1.10 mishandles long
// paths) and Windows LongPathsEnabled set in the registry — this plugin only
// wires the Gradle-side args.
// See https://github.com/kirillzyusko/react-native-keyboard-controller/issues/1247
const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "// keyboard-controller-long-paths-fix";

function withKeyboardControllerLongPaths(config) {
  if (process.platform !== "win32") {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    const addition = `
${MARKER}
import org.apache.tools.ant.taskdefs.condition.Os
android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                def cmakeDir = "\${android.sdkDirectory}/cmake/3.22.1/bin"
                def ninjaExecutable = Os.isFamily(Os.FAMILY_WINDOWS) ? "ninja.exe" : "ninja"
                def ninjaPath = "\${cmakeDir}/\${ninjaExecutable}".replace("\\\\", "/")
                arguments "-DCMAKE_MAKE_PROGRAM=\${ninjaPath}", "-DCMAKE_OBJECT_PATH_MAX=1024"
            }
        }
    }
}
`;

    config.modResults.contents += addition;
    return config;
  });
}

module.exports = withKeyboardControllerLongPaths;
