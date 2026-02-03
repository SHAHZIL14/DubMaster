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
      text: text
    });
    const outputPath = path.join(process.cwd(), "Public", "Temp", "TTS", jobId);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    const filePath = path.join(outputPath, `${part}.wav`);
    const audioBase64 = result.data[0];

    if (!audioBase64) {
      throw new Error("No audio returned from HF Space");
    }

    // 4️⃣ Convert base64 → WAV
    const buffer = Buffer.from(audioBase64, "base64");

    // 5️⃣ Save file
    fs.writeFileSync(filePath, buffer);
    console.log("✅ Audio saved as output.wav");
    return outputPath;
  } catch (error) {
    console.log(error.message || "Something went wrong while tts generation");
  }
}

export { generateTTS };