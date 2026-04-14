import ffmpeg from "fluent-ffmpeg";

const mergeAudioVideo = (videoPath, audioPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',
        '-c:a aac',
        '-map 0:v:0',
        '-map 1:a:0',
        '-shortest'
      ])
      .save(outputPath)
      .on('end', () => {
        console.log('✅ Audio merged with video');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ Merge error:', err);
        reject(err);
      });
  });
};

export { mergeAudioVideo };