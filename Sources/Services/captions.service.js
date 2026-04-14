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

    // We add an initial prompt to "teach" Whisper to use punctuation.
    // We also set temperature to 0 for more consistent, literal output.
    const initialPrompt = "Hello, this is a transcript. It includes commas, periods, and proper casing.";
    const cmd = `python -m whisper "${audioPath}" --model medium --output_format srt --output_dir "${tempDir}" --temperature 0 --condition_on_previous_text True`;
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