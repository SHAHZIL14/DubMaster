import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";

ffmpeg.setFfprobePath(ffprobe.path);
const getVideoDuration = function (filePath) {
  return new Promise(function (resolve, reject) {
    ffmpeg.ffprobe(filePath, function (error, metadata) {
      if (error) reject(error);
      resolve(metadata.format.duration);
    });
  });
};

export { getVideoDuration };