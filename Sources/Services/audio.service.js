import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const extractAudio = function (filePath) {
  const tempDir = path.join(process.cwd(), "Public", "Temp", "Audios");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localPath = path.join(tempDir, `${path.basename(filePath).replace(".mp4", ".wav")}`)
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .format("wav")
      .save(localPath)
      .on("end", () => resolve(localPath))
      .on("error", reject);
  });
}

export { extractAudio };