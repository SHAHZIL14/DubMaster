import { exec } from "child_process"
import fs from "fs";
import path from "path";

const generateCaptions = (audioPath) => {
  return new Promise((resolve, reject) => {

    const tempDir = path.join(process.cwd(), "Public", "Temp", "Captions");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const baseName = path.basename(audioPath, path.extname(audioPath));
    const localPath = path.join(tempDir, `${baseName}.srt`);

    const cmd = `python -m whisper "${audioPath}" --model small --output_format srt --output_dir "${tempDir}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      if (!fs.existsSync(localPath)) {
        return reject(new Error("Caption file was not generated"));
      }

      resolve(localPath);
    });
  });
};

export { generateCaptions }