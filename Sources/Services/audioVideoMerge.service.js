import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const mergeAudioWithVideo = (videoPath, audioPath, jobId) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(
      process.cwd(),
      "Public",
      "Temp",
      "Output",
      jobId,
    );
    ensureDir(outputDir);
    const outputPath = path.join(outputDir, "output.mp4");
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        "-map 0:v",
        "-map 1:a",
        "-c:v copy",
        "-c:a aac",
        "-shortest"
      ])
      .on("end", () => {
        console.log("✅ Video + new audio merged");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Merge error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

export { mergeAudioWithVideo }