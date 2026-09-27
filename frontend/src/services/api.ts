import * as FileSystem from "expo-file-system/legacy";

export type StylePreset = "corporate" | "editorial" | "dating";

export interface GenerationResult {
  success: boolean;
  resultUrl?: string;
  error?: string;
}

const PRODUCTION_API_URL = "https://aura-studio-api.onrender.com";

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

async function toUploadableImage(imageUri: string): Promise<string> {
  if (
    imageUri.startsWith("http://") ||
    imageUri.startsWith("https://") ||
    imageUri.startsWith("data:")
  ) {
    return imageUri;
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${guessMimeType(imageUri)};base64,${base64}`;
}

export const generateHeadshot = async (
  imageUri: string,
  stylePreset: StylePreset
): Promise<GenerationResult> => {
  try {
    const uploadableImage = await toUploadableImage(imageUri);
    const response = await fetch(`${PRODUCTION_API_URL}/api/generate-headshot-v2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUri: uploadableImage, stylePreset }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Generation failed on server");

    return { success: true, resultUrl: data.resultUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error occurred.";
    return { success: false, error: message };
  }
};
