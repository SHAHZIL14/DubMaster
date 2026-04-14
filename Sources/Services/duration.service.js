import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegPath);

const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    // console.log('getDuration called with:', filePath); // 🔥 ADD THIS

    if (!filePath) {
      return reject(new Error('No filePath provided'));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      try {
        let duration = metadata?.format?.duration;

        if (!duration && metadata?.streams?.length) {
          const streamWithDuration = metadata.streams.find(
            (s) => s.duration
          );
          duration = streamWithDuration?.duration;
        }

        if (!duration || isNaN(duration)) {
          return reject(new Error("Duration not found"));
        }

        resolve(parseFloat(duration));
      } catch (error) {
        reject(error);
      }
    });
  });
};

export { getDuration };
