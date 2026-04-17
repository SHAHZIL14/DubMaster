import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const buildFinalAudio = (syncedAudioMeta, jobId) => {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(
      process.cwd(),
      "Public",
      "Temp",
      "Merge",
      jobId
    );

    ensureDir(tempDir);

    const outputPath = path.join(tempDir, `${jobId}-temp.wav`);
    const command = ffmpeg();

    // 1. Add all inputs
    syncedAudioMeta.forEach(seg => {
      command.input(seg.path);
    });

    // 2. Create delay filters
    const filters = [];

    syncedAudioMeta.forEach((seg, i) => {
      filters.push(
        `[${i}:a]adelay=${seg.start}|${seg.start}[a${i}]`
      );
    });

    // 3. Mix all
    const mix = syncedAudioMeta.map((_, i) => `[a${i}]`).join("");

    filters.push(
      `${mix}amix=inputs=${syncedAudioMeta.length}:duration=longest`
    );

    // 4. Apply
    command
      .complexFilter(filters)
      .outputOptions([
        "-y",
        "-ac 1",
        "-ar 44100",
        "-c:a pcm_s16le"
      ])
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
};

export { buildFinalAudio };