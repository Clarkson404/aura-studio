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

// Increase JSON body limit for Base64 images
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
        res.status(400).json({ error: "Valid base64 data URI is required" });
        return;
      }

      if (!process.env.FAL_KEY || process.env.FAL_KEY === "YOUR_FAL_KEY_HERE") {
        res.status(500).json({ error: "FAL_KEY is not configured." });
        return;
      }

      console.log(`Received request for style: ${stylePreset}`);

      const result = (await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          reference_image_url: imageUri,
          prompt: `Professional high quality headshot, ${stylePreset} style, 8k resolution, studio lighting`,
        },
        logs: true,
      })) as FluxPulidResult;

      const resultUrl = result.images?.[0]?.url;
      if (!resultUrl) {
        res.status(500).json({ error: "Generation failed" });
        return;
      }

      console.log("fal.ai generation successful!");
      res.json({ success: true, resultUrl });
    } catch (error: unknown) {
      console.error("FAL AI Processing Error:", error);
      const message = error instanceof Error ? error.message : "Generation failed";
      res.status(500).json({ error: message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
