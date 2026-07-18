import { useRouter } from "expo-router";
import { ShareIntentFile, useShareIntentContext } from "expo-share-intent";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  saveImagePersistently,
  saveVideoPersistently,
} from "@/services/mediaStorage";

type AppRouter = ReturnType<typeof useRouter>;

// Saves the shared file and navigates to Create Memory with it pre-attached.
async function navigateToCreateMemoryWithSharedFile(
  file: ShareIntentFile,
  router: AppRouter,
  resetShareIntent: (clearNativeModule?: boolean) => void,
) {
  try {
    const isVideo = file.mimeType.startsWith("video/");
    const saved = isVideo
      ? await saveVideoPersistently(file.path)
      : await saveImagePersistently(file.path);

    const params = {
      sharedMediaUri: saved.uri,
      sharedMediaType: isVideo ? "video" : "image",
      ...(saved.mediaLibraryAssetId
        ? { sharedMediaAssetId: saved.mediaLibraryAssetId }
        : {}),
    };
    router.push({
      pathname: "/(memories)/creatememory",
      params,
    });
  } catch (err) {
    console.error("Error handling shared media:", err);
  } finally {
    resetShareIntent();
  }
}

// Navigates to Create Memory when a shared image/video is received.
export function useSharedMediaNavigation() {
  const { username } = useContext(AuthContext);
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  useEffect(() => {
    if (!username || !hasShareIntent) return;

    const file = shareIntent.files?.[0];
    if (!file) return;

    navigateToCreateMemoryWithSharedFile(file, router, resetShareIntent);
  }, [username, hasShareIntent, shareIntent, router, resetShareIntent]);
}
