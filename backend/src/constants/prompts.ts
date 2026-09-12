export const STYLE_PRESETS = {
  corporate:
    "Professional corporate headshot of the same person, facing the camera with a confident, approachable expression. Sharp tailored business attire, clean studio lighting, soft key light and subtle rim light, seamless muted office-gray background, photorealistic, 85mm portrait lens, high detail skin texture, magazine-quality retouching, authentic likeness.",
  editorial:
    "High-fashion editorial portrait of the same person, cinematic lighting, dramatic side light and deep shadows, stylish wardrobe, refined makeup, shallow depth of field, luxury magazine cover aesthetic, photorealistic, 85mm lens, rich color grading, authentic facial identity.",
  dating:
    "Warm, attractive lifestyle dating-profile portrait of the same person, natural outdoor golden-hour lighting, genuine relaxed smile, casual but polished outfit, softly blurred background, flattering angles, photorealistic, 50mm lens, healthy skin, authentic likeness, inviting and approachable.",
} as const;

export type StylePreset = keyof typeof STYLE_PRESETS;

export const NEGATIVE_PROMPT =
  "blurry, deformed, extra limbs, extra fingers, mutated hands, bad anatomy, distorted face, identity shift, different person, cartoon, illustration, text, watermark, logo, low quality, oversharpened, plastic skin";

export const DEFAULT_STYLE: StylePreset = "corporate";

export function isStylePreset(value: string): value is StylePreset {
  return value in STYLE_PRESETS;
}
