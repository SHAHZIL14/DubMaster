import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { createSilence } from "./silenceWav.service.js";

const buildTimeline = async function (cues, normalizedAudioPaths, jobId) {
  let currentTimelinePosition = 0;
  const timelineFiles = [];

  const tempDir = path.join(
    process.cwd(),
    "Public",
    "Temp",
    "Timeline",
    jobId
  );

  fs.mkdirSync(tempDir, { recursive: true });

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const cueStart = cue.data.start;
    const cueEnd = cue.data.end;
    const cueDuration = cueEnd - cueStart;

    const audioPath = normalizedAudioPaths[i];

    // 1️⃣ Calculate silence needed BEFORE this cue
    let silenceBefore = cueStart - currentTimelinePosition;

    // 2️⃣ If we are early → add silence
    if (silenceBefore > 0) {
      const silencePath = path.join(
        tempDir,
        `silence-${i}.wav`
      );

      await createSilence(silencePath, silenceBefore);
      timelineFiles.push(silencePath);

      currentTimelinePosition += silenceBefore;
    }

    // 3️⃣ If we are late → overlap → DO NOTHING
    // (previous silence already covers it)
    // NEVER trim speech here

    // 4️⃣ Add cue audio
    timelineFiles.push(audioPath);
    currentTimelinePosition += cueDuration;
  }

  return {
    timelineFiles,
    finalDuration: currentTimelinePosition
  };
}


export { buildTimeline };