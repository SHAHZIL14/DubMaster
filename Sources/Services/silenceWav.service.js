import { execFile } from "child_process";
import path from "path";
import fs from "fs";

const createSilence = function (outputPath, durationSec) {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-f", "lavfi",
        "-t", durationSec.toString(),
        "-i", "anullsrc=r=44100:cl=mono",
        outputPath
      ],
      (err) => {
        if (err) reject(err);
        else resolve(outputPath);
      }
    );
  });
}

export { createSilence };