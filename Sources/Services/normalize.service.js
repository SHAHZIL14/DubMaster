import path from "path";
import { execFile } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { getDuration } from "./duration.service.js";

ffmpeg.setFfmpegPath(ffmpegPath);

/* -------------------- HELPERS -------------------- */

const msToSec = (ms) => ms / 1000;

/* -------------------- PAD WITH CENTERED SILENCE -------------------- */
/**
 * Adds silence before & after audio so total duration == cueDuration
 */
const padWithSilence = (inputWav, outputWav, cueDuration, ttsDuration) => {
  const padEachSide = Math.max((cueDuration - ttsDuration) / 2, 0);

  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-i", inputWav,
        "-af",
        `adelay=${padEachSide * 1000}|${padEachSide * 1000},apad`,
        "-t", `${cueDuration}`,
        outputWav
      ],
      (err) => {
        if (err) reject(err);
        else resolve(outputWav);
      }
    );
  });
};

/* -------------------- TIME STRETCH -------------------- */
/**
 * Speeds up or slows down audio to exactly fit cueDuration
 */
const timeStretch = (inputWav, outputWav, ttsDuration, cueDuration) => {
  let atempo = +(ttsDuration / cueDuration).toFixed(3);

  // FFmpeg safety limits
  if (atempo < 0.5 || atempo > 2.0) {
    throw new Error("atempo out of FFmpeg safe range");
  }

  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-i", inputWav,
        "-filter:a", `atempo=${atempo}`,
        "-t", `${cueDuration}`,
        outputWav
      ],
      (err) => {
        if (err) reject(err);
        else resolve(outputWav);
      }
    );
  });
};

/* -------------------- NORMALIZE -------------------- */
/**
 * Makes TTS audio perfectly fit subtitle cue timing
 */
const normalize = async (audioCue, audioFile, jobId, index) => {

  const outputWav = path.join(
    process.cwd(),
    "Public",
    "Temp",
    "Normalized",
    `${jobId}-${index}.wav`
  );

  const start = msToSec(audioCue.data.start);
  const end = msToSec(audioCue.data.end);

  const cueDuration = +(end - start).toFixed(3);
  const ttsDuration = +(await getDuration(audioFile)).toFixed(3);

  /* ---------- CASE 1: TTS shorter ---------- */
  if (ttsDuration < cueDuration) {
    const ratio = +(ttsDuration / cueDuration).toFixed(3);

    // Slight slow-down sounds natural
    if (ratio >= 0.88) {
      return await timeStretch(
        audioFile,
        outputWav,
        ttsDuration,
        cueDuration
      );
    }

    // Otherwise pad with centered silence
    return await padWithSilence(
      audioFile,
      outputWav,
      cueDuration,
      ttsDuration
    );
  }

  /* ---------- CASE 2: Slight overflow ---------- */
  if (ttsDuration <= cueDuration * 1.12) {
    return await timeStretch(
      audioFile,
      outputWav,
      ttsDuration,
      cueDuration
    );
  }

  /* ---------- CASE 3: Too long → hard trim ---------- */
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-i", audioFile,
        "-t", `${cueDuration}`,
        outputWav
      ],
      (err) => {
        if (err) reject(err);
        else resolve(outputWav);
      }
    );
  });
};

export {
  normalize,
  padWithSilence,
  timeStretch
};
