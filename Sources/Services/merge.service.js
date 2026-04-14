import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import ffmpegPath from "ffmpeg-static";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const mergeAudio = (files, jobId) => {
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(files)) {
        throw new Error("files must be an array");
      }

      const validFiles = files.filter((f) => f != null);

      if (validFiles.length === 0) {
        throw new Error("No valid audio files to merge");
      }

      // ✅ TEMP job-specific directory
      const tempDir = path.join(
        process.cwd(),
        "Public",
        "Temp",
        "Merge",
        jobId
      );

      ensureDir(tempDir);

      const tempOutputPath = path.join(tempDir, `${jobId}-temp.wav`);

      // 👉 build ffmpeg inputs
      const inputs = [];
      validFiles.forEach((f) => inputs.push("-i", f));

      const filters = validFiles
        .map(
          (_, i) =>
            `[${i}:a]aformat=sample_rates=44100:channel_layouts=mono,asetpts=PTS-STARTPTS[a${i}]`
        )
        .join(";");

      const concatInputs = validFiles.map((_, i) => `[a${i}]`).join("");

      const filterComplex = `${filters};${concatInputs}concat=n=${validFiles.length}:v=0:a=1[out]`;

      execFile(
        ffmpegPath,
        [
          "-y",
          ...inputs,
          "-filter_complex",
          filterComplex,
          "-map",
          "[out]",
          "-acodec",
          "pcm_s16le",
          tempOutputPath
        ],
        (err) => {
          if (err) return reject(err);

          // ✅ FINAL persistent directory
          const finalDir = path.join(process.cwd(), "Public", "Temp","Merge");
          ensureDir(finalDir);

          const finalPath = path.join(finalDir, `${jobId}.wav`);

          fs.renameSync(tempOutputPath, finalPath);

          console.log("✅ Final merged file:", finalPath);
          fs.rmdirSync(tempDir);
          resolve(finalPath);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export { mergeAudio };