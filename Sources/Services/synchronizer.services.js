import { getDuration } from "./duration.service.js";
import ffmpeg from "fluent-ffmpeg";

const synchronize = function (audioPath, videoPath, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const audioDuration = await getDuration(audioPath);
      const videoDuration = await getDuration(videoPath);
      console.log("audioDuration->", audioDuration);
      console.log("videoDuration->", videoDuration);

      if (!videoDuration || !audioDuration) {
        return reject(new Error('Invalid durations'));
      }

      // ✅ FIXED
      let rate = audioDuration / videoDuration;
      console.log("rate->", rate);
      const filters = [];

      while (rate > 2.0) {
        filters.push(2.0);
        rate /= 2.0;
      }

      while (rate < 0.5) {
        filters.push(0.5);
        rate /= 0.5;
      }

      filters.push(rate);

      const atempoFilter = filters.map(v => `atempo=${v}`).join(',');

      ffmpeg(audioPath)
        .audioFilters(atempoFilter)
        .outputOptions(['-vn'])
        .save(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

export { synchronize };