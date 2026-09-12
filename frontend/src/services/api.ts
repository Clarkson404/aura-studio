import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export type StylePreset = "corporate" | "editorial" | "dating";

export type GenerateHeadshotResult = {
  url: string;
  stylePreset: StylePreset;
};

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://aura-studio-backend.onrender.com"
).replace(/\/$/, "");

const GENERATE_PATH = "/api/generate-headshot-v2";
const REQUEST_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 2_500;
const MAX_POLLS = 48;

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

  if (Platform.OS === "web") {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the selected image."));
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${guessMimeType(imageUri)};base64,${base64}`;
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let payload: Record<string, unknown> = {};
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error("The studio returned an unexpected response.");
      }
    }

    if (!response.ok) {
      const message =
        typeof payload.error === "string"
          ? payload.error
          : `Headshot generation failed (${response.status}).`;
      throw new Error(message);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Generation is taking too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function extractResultUrl(payload: Record<string, unknown>): string | undefined {
  const candidates = [payload.url, payload.imageUrl, payload.image_url, payload.resultUrl];
  return candidates.find((value): value is string => typeof value === "string" && value.length > 0);
}

function extractJobId(payload: Record<string, unknown>): string | undefined {
  const candidates = [payload.jobId, payload.job_id, payload.id];
  return candidates.find((value): value is string => typeof value === "string" && value.length > 0);
}

async function pollForResult(jobId: string): Promise<Record<string, unknown>> {
  const endpoints = [
    `${API_URL}${GENERATE_PATH}/${encodeURIComponent(jobId)}`,
    `${API_URL}/api/jobs/${encodeURIComponent(jobId)}`,
  ];

  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    for (const endpoint of endpoints) {
      try {
        const payload = await fetchJson(endpoint, { method: "GET" }, 20_000);
        const url = extractResultUrl(payload);
        const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
        if (url || status === "complete" || status === "completed" || status === "succeeded") {
          return payload;
        }
        if (status === "failed" || status === "error") {
          throw new Error(
            typeof payload.error === "string" ? payload.error : "Generation failed."
          );
        }
      } catch (error) {
        if (attempt === MAX_POLLS - 1) {
          throw error;
        }
      }
    }
  }

  throw new Error("Still processing. Please try again in a moment.");
}

export async function generateHeadshot(
  imageUri: string,
  stylePreset: StylePreset
): Promise<GenerateHeadshotResult> {
  const uploadableImage = await toUploadableImage(imageUri);
  const payload = await fetchJson(`${API_URL}${GENERATE_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUri: uploadableImage,
      stylePreset,
    }),
  });

  let resolved = payload;
  const immediateUrl = extractResultUrl(resolved);
  const jobId = extractJobId(resolved);
  const status = typeof resolved.status === "string" ? resolved.status.toLowerCase() : "";

  if (!immediateUrl && jobId && status !== "complete" && status !== "completed") {
    resolved = await pollForResult(jobId);
  }

  const url = extractResultUrl(resolved);
  if (!url) {
    throw new Error("The studio did not return a result image.");
  }

  return { url, stylePreset };
}
