// expo-audio unconditionally bundles a MediaSessionService
// (expo.modules.audio.service.AudioControlsService) and the
// FOREGROUND_SERVICE_MEDIA_PLAYBACK permission it requires, for apps that
// want lock-screen/notification playback controls via
// AudioPlayer.setActiveForLockScreen(). Nothing in this app calls that API
// (see components/memories/MediaGallery/MediaPreviewModal.tsx's plain
// useAudioPlayer() usage), so the service can never start — it's unused
// dead weight that Play Console flags as an undeclared foreground-service
// permission. Both the permission and the service are stripped via the
// Android manifest merger's tools:node="remove" override; both must be
// removed together since a foregroundServiceType="mediaPlayback" service
// requires its matching permission to pass manifest-merge validation.
const { withAndroidManifest } = require("@expo/config-plugins");

const UNUSED_MEDIA_PLAYBACK_PERMISSION =
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK";
const UNUSED_MEDIA_PLAYBACK_SERVICE =
  "expo.modules.audio.service.AudioControlsService";

function withRemovedMediaPlaybackService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    const permissions = manifest["uses-permission"] ?? [];
    const permissionAlreadyRemoved = permissions.some(
      (entry) => entry.$["android:name"] === UNUSED_MEDIA_PLAYBACK_PERMISSION,
    );
    if (!permissionAlreadyRemoved) {
      permissions.push({
        $: {
          "android:name": UNUSED_MEDIA_PLAYBACK_PERMISSION,
          "tools:node": "remove",
        },
      });
      manifest["uses-permission"] = permissions;
    }

    const application = manifest.application?.[0];
    if (application) {
      const services = application.service ?? [];
      const serviceAlreadyRemoved = services.some(
        (entry) => entry.$["android:name"] === UNUSED_MEDIA_PLAYBACK_SERVICE,
      );
      if (!serviceAlreadyRemoved) {
        services.push({
          $: {
            "android:name": UNUSED_MEDIA_PLAYBACK_SERVICE,
            "tools:node": "remove",
          },
        });
        application.service = services;
      }
    }

    return config;
  });
}

module.exports = withRemovedMediaPlaybackService;
