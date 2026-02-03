import fs from "fs";
import path from "path";
import axios from "axios";


const downloadFromCloudinary = async function (fileUrl, extension = ".mp4") {
  const tempDir = path.join(process.cwd(), "Public", "Temp", "Videos");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localPath = path.join(tempDir, `${Date.now()}${extension}`);
  const writer = fs.createWriteStream(localPath);

  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
    timeout: 60_000,
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(localPath));
    writer.on("error", reject);
  });
};

const downloadFromHuggingFace = async function (url, jobId, part) {
  const downloadDir = path.resolve(process.cwd(), "Public", "Temp", "TTS", jobId);
  const downloadUrl = url.replace('/blob/', '/resolve/');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true })
  }
  const outputPath = path.join(downloadDir, `${part}.wav`);
  const writer = fs.createWriteStream(outputPath);

  console.log(`Starting download: ${url}`);

  const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: {
        // Essential: Tell the server where the request "came from"
        'Referer': 'https://shazil14-my-hindi-tts.hf.space/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`Success! File saved to: ${outputPath}`);
      resolve();
    });
    writer.on('error', (err) => {
      console.error('Download failed:', err);
      reject(err);
    });
  });
}

export { downloadFromCloudinary, downloadFromHuggingFace };