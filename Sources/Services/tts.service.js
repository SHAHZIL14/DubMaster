import { Client } from "@gradio/client";
import config from "../../Configuration/config.js";
import fs from "fs";
import path from "path";

const generateTTS = async function (text, jobId, part) {
  try {
    const client = await Client.connect("shazil14/my-hindi-tts", {
      token: config.hfToken
    });

    const result = await client.predict("/predict", {
      text: text,
    });

    const outputDir = path.join(
      process.cwd(),
      "Public",
      "Temp",
      "TTS",
      jobId
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ✅ unique filename
    const filePath = path.join(outputDir, `${jobId}-${part}.wav`);

    const audioBase64 = result.data[0];

    if (!audioBase64) {
      throw new Error("No audio returned from HF Space");
    }

    const buffer = Buffer.from(audioBase64, "base64");

    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Audio saved: ${filePath}`);

    return filePath;
  } catch (error) {
    console.log(error.message || "TTS generation failed");
  }
};

export { generateTTS };

