import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import * as fal from "@fal-ai/serverless-client";
import {
  DEFAULT_STYLE,
  isStylePreset,
  NEGATIVE_PROMPT,
  STYLE_PRESETS,
  type StylePreset,
} from "./constants/prompts";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

fal.config({
  credentials: process.env.FAL_KEY,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

type GenerateBody = {
  imageUri?: string;
  image_uri?: string;
  imageUrl?: string;
  image_url?: string;
  stylePreset?: string;
  style?: string;
  preset?: string;
};

type FluxPulidResult = {
  images?: Array<{ url?: string }>;
};

type CodeformerResult = {
  image?: { url?: string };
};

function resolveImageUri(body: GenerateBody): string | undefined {
  return body.imageUri ?? body.image_uri ?? body.imageUrl ?? body.image_url;
}

function resolveStylePreset(body: GenerateBody): StylePreset | null {
  const raw = (body.stylePreset ?? body.style ?? body.preset ?? DEFAULT_STYLE)
    .toString()
    .trim()
    .toLowerCase();

  if (!raw) {
    return DEFAULT_STYLE;
  }

  return isStylePreset(raw) ? raw : null;
}

app.post(
  "/api/generate-headshot-v2",
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!process.env.FAL_KEY || process.env.FAL_KEY === "YOUR_FAL_KEY_HERE") {
        res.status(500).json({ error: "FAL_KEY is not configured." });
        return;
      }

      const imageUri = resolveImageUri(req.body as GenerateBody);
      const stylePreset = resolveStylePreset(req.body as GenerateBody);

      if (!imageUri) {
        res.status(400).json({
          error: "Missing image URI. Provide imageUri (or imageUrl / image_url).",
        });
        return;
      }

      if (!stylePreset) {
        res.status(400).json({
          error: `Invalid style preset. Use one of: ${Object.keys(STYLE_PRESETS).join(", ")}.`,
        });
        return;
      }

      const pulidResult = (await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          prompt: STYLE_PRESETS[stylePreset],
          reference_image_url: imageUri,
          negative_prompt: NEGATIVE_PROMPT,
          image_size: "portrait_4_3",
          num_inference_steps: 28,
          guidance_scale: 4,
          id_weight: 1,
          true_cfg: 1,
          enable_safety_checker: true,
        },
      })) as FluxPulidResult;

      const generatedUrl = pulidResult.images?.[0]?.url;
      if (!generatedUrl) {
        res.status(502).json({ error: "fal-ai/flux-pulid did not return an image URL." });
        return;
      }

      const restoredResult = (await fal.subscribe("fal-ai/codeformer", {
        input: {
          image_url: generatedUrl,
          fidelity: 0.7,
          upscale_factor: 2,
          face_upscale: true,
          only_center_face: true,
        },
      })) as CodeformerResult;

      const resultUrl = restoredResult.image?.url;
      if (!resultUrl) {
        res.status(502).json({ error: "fal-ai/codeformer did not return an image URL." });
        return;
      }

      res.json({
        url: resultUrl,
        stylePreset,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Headshot generation failed.";
      res.status(500).json({ error: message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
