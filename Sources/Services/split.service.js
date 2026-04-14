import fs from "fs";
import path from "path";
import { createSilence } from "./silenceWav.service.js";
import { generateTTS } from "./tts.service.js";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/* ---------- SPLIT TEXT WITH  ---------- */

const splitWithPauses = (text) => {
  const parts = [];

  const regex = /([^,.!?]+)([,.!?]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const phrase = match[1].trim();
    const punct = match[2];

    if (phrase) {
      parts.push({ text: phrase, pause: 0 });
    }

    const lastChar = punct[punct.length - 1];

    const pause =
      lastChar === "," ? 0.25 :
      lastChar === "." || lastChar === "?" || lastChar === "!" ? 0.55 :
      0;

    if (pause > 0) {
      parts.push({ text: null, pause });
    }

    lastIndex = regex.lastIndex;
  }

  // leftover text without punctuation
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    parts.push({ text: remaining, pause: 0 });
  }

  return parts;
};

/* ---------- GENERATE AUDIO WITH PAUSES ---------- */

const generateWithSplit = async (text, jobId, index) => {
  const parts = splitWithPauses(text);

  const silenceDir = path.join(process.cwd(), "Public", "Temp", "Silence");
  ensureDir(silenceDir);

  const audioParts = [];
  let localIndex = 0;

  for (const part of parts) {
    try {
      if (part.text) {
        const ttsPath = await generateTTS(
          part.text,
          jobId,
          `${index}-${localIndex}`
        );

        if (ttsPath) audioParts.push(ttsPath);
      } else {
        const silencePath = path.join(
          silenceDir,
          `${jobId}-silence-${index}-${localIndex}.wav`
        );

        const silence = await createSilence(silencePath, part.pause);
        audioParts.push(silence);
      }

      localIndex++;
    } catch (err) {
      console.error("Prosody generation failed:", err.message);
    }
  }
  return audioParts.filter(Boolean);
};

export { splitWithPauses, generateWithSplit };