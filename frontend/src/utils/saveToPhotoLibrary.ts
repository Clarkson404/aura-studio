import * as MediaLibrary from "expo-media-library";

export async function saveToPhotoLibrary(uri: string): Promise<"saved" | "denied"> {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    return "denied";
  }
  await MediaLibrary.saveToLibraryAsync(uri);
  return "saved";
}
