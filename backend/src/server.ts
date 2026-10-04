import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import * as fal from "@fal-ai/serverless-client";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

fal.config({
  credentials: process.env.FAL_KEY,
});

const app = express();

// Enable CORS for mobile app requests
app.use(cors());
app.use(express.json({ limit: "50mb" }));

type GenerateBody = {
  imageUri?: string;
  stylePreset?: string;
};

type FluxPulidResult = {
  images?: Array<{ url?: string }>;
};

app.post(
  "/api/generate-headshot-v2",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageUri, stylePreset } = req.body as GenerateBody;

      if (!imageUri || !imageUri.startsWith("data:image")) {
        res.status(400).json({
          error: "Invalid image payload. Must be a valid base64 data URI.",
        });
        return;
      }

      if (!process.env.FAL_KEY || process.env.FAL_KEY === "YOUR_FAL_KEY_HERE") {
        res.status(500).json({ error: "FAL_KEY is not configured." });
        return;
      }

      console.log(`Processing ${stylePreset} headshot via fal.ai...`);

      const result = (await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          reference_image_url: imageUri,
          prompt: `Professional high quality headshot, ${stylePreset} style, 8k resolution, studio lighting`,
        },
        logs: true,
      })) as FluxPulidResult;

      const resultUrl = result.images?.[0]?.url;
      if (!resultUrl) {
        res.status(422).json({ error: "fal.ai processing failed" });
        return;
      }

      res.json({ success: true, resultUrl });
    } catch (error: unknown) {
      console.error("FAL AI Error:", error);
      const message = error instanceof Error ? error.message : "fal.ai processing failed";
      res.status(422).json({ error: message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
