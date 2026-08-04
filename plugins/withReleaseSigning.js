// Re-applies the release signingConfig (reading android-signing/keystore.properties,
// falling back to the debug key if that file doesn't exist) after every prebuild,
// since android/app/build.gradle is regenerated from scratch and would otherwise
// lose this hand-added block. See android-signing/ for the actual keystore.
const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "// release-signing-fix";

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes(MARKER)) {
      return config;
    }

    const propertiesLoader = `${MARKER}
    def releaseKeystorePropertiesFile = rootProject.file('../android-signing/keystore.properties')
    def releaseKeystoreProperties = new Properties()
    if (releaseKeystorePropertiesFile.exists()) {
        releaseKeystoreProperties.load(new FileInputStream(releaseKeystorePropertiesFile))
    }
    signingConfigs {`;

    const stockSigningConfigsOpen = "    signingConfigs {";
    if (!config.modResults.contents.includes(stockSigningConfigsOpen)) {
      throw new Error(
        "withReleaseSigning: could not find the stock 'signingConfigs {' block to patch — react-native template may have changed.",
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      stockSigningConfigsOpen,
      propertiesLoader,
    );

    const stockDebugSigningConfigClose = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;
    const debugSigningConfigWithRelease = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (releaseKeystorePropertiesFile.exists()) {
                storeFile rootProject.file("../android-signing/\${releaseKeystoreProperties['storeFile']}")
                storePassword releaseKeystoreProperties['storePassword']
                keyAlias releaseKeystoreProperties['keyAlias']
                keyPassword releaseKeystoreProperties['keyPassword']
            }
        }
    }`;
    if (!config.modResults.contents.includes(stockDebugSigningConfigClose)) {
      throw new Error(
        "withReleaseSigning: could not find the stock debug signingConfig block to patch — react-native template may have changed.",
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      stockDebugSigningConfigClose,
      debugSigningConfigWithRelease,
    );

    const stockReleaseBuildTypeSigning = `            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;
    const conditionalReleaseSigning = `            signingConfig releaseKeystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`;
    if (!config.modResults.contents.includes(stockReleaseBuildTypeSigning)) {
      throw new Error(
        "withReleaseSigning: could not find the stock release buildType signingConfig line to patch — react-native template may have changed.",
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      stockReleaseBuildTypeSigning,
      conditionalReleaseSigning,
    );

    return config;
  });
}

module.exports = withReleaseSigning;
