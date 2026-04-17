import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfprobePath(ffprobe.path);

// 🔹 Get duration (seconds)
const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration);
    });
  });
};

// 🔹 Apply atempo safely (supports chaining)
const buildAtempoFilter = (ratio) => {
  let filters = [];

  // atempo supports 0.5–2.0 only → chain if needed
  while (ratio > 2.0) {
    filters.push("atempo=2.0");
    ratio /= 2.0;
  }

  while (ratio < 0.5) {
    filters.push("atempo=0.5");
    ratio /= 0.5;
  }

  filters.push(`atempo=${ratio.toFixed(3)}`);
  return filters.join(",");
};

export const synchronizeSegment = async ({
  audioPath,
  targetDuration, // in ms
  jobId,
  index
}) => {
  const outputDir = path.join(process.cwd(), "Public", "Temp", "Synchronized", jobId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${index}.wav`);

  const actualDuration = await getDuration(audioPath); // seconds
  const targetSec = targetDuration / 1000;

  const diff = Math.abs(actualDuration - targetSec);

  // 🎯 Small difference (< 100ms) → ignore
  if (diff < 0.1) {
    return audioPath;
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg(audioPath);

    // 🔥 CASE 1: Audio SHORT → PAD
    if (actualDuration < targetSec) {
      const padDuration = targetSec - actualDuration;

      command = command.audioFilters([
        `apad=pad_dur=${padDuration}`
      ]);
    }

    // 🔥 CASE 2: Audio LONG → SPEED ADJUST + TRIM
    else if (actualDuration > targetSec) {
      const speedRatio = actualDuration / targetSec;

      const atempoFilter = buildAtempoFilter(speedRatio);

      command = command.audioFilters([atempoFilter])
        .setDuration(targetSec); // final safety trim
    }

    command
      .outputOptions("-y")
      .audioCodec("pcm_s16le")
      .on("start", (cmd) => {
        console.log(`🎧 Syncing [${index}]`);
        console.log("FFmpeg:", cmd);
      })
      .on("end", () => {
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Sync Segment Error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};