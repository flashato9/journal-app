import placeholderProfilePicture from "@/assets/register/profile-picture-placeholder.png";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import {
  AppPrivateDirectoryPaths,
  ensureDirectoryExists,
  getAppDirectory,
} from "@/services/filesystem";

// Profile pictures always live in local app storage, in both dev and
// production builds (unlike memory photos, there's no Gallery split).
const getProfilePicturesDir = async () => {
  const dir = getAppDirectory(AppPrivateDirectoryPaths.ProfilePictures);
  await ensureDirectoryExists(dir);
  return dir;
};

// Copies a picked photo's temporary URI into the profile pictures directory.
export const saveProfilePicture = async (
  temporaryUri: string,
): Promise<string> => {
  const profilePicturesDir = await getProfilePicturesDir();
  const targetUri = `${profilePicturesDir.uri}/profile_${Date.now()}.jpg`;

  const file = new File(temporaryUri);
  const targetFile = new File(targetUri);
  await file.copy(targetFile);

  return targetUri;
};

// Copies the bundled placeholder image into the profile pictures directory,
// for accounts registered without picking a profile picture.
export const savePlaceholderProfilePicture = async (): Promise<string> => {
  const asset = Asset.fromModule(placeholderProfilePicture);
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error("Failed to resolve placeholder profile picture asset");
  }

  const profilePicturesDir = await getProfilePicturesDir();
  const targetUri = `${profilePicturesDir.uri}/placeholder_${Date.now()}.png`;

  const file = new File(asset.localUri);
  const targetFile = new File(targetUri);
  await file.copy(targetFile);

  return targetUri;
};
