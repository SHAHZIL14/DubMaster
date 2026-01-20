import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";
import { exec } from "child_process"
import fs from "fs";
import path, { format } from "path";
import axios from "axios";
import { asyncHandler } from "./asyncHandler.utility.js";
import { application } from "express";
import { json } from "stream/consumers";

ffmpeg.setFfprobePath(ffprobe.path);

const getVideoDuration = function (filePath) {
  return new Promise(function (resolve, reject) {
    ffmpeg.ffprobe(filePath, function (error, metadata) {
      if (error) reject(error);
      resolve(metadata.format.duration);
    });
  });
};

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

const translateText = async function (text, sourceLang, targetLang) {
  const LIBRE_URL = "http://localhost:5000";
  if (!text || text.length == 0 || !text.trim()) return;
  try {
    const response = await axios.post(`${LIBRE_URL}/translate`, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text"
    });

    return response.data.translatedText;
  } catch (error) {
    console.error("LibreTranslate error:", error.response?.data || error.message);
    throw error;
  }
};




export { getVideoDuration, downloadFromCloudinary, extractAudio, generateCaptions, translateText };
