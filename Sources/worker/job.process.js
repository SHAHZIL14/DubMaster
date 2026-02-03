import fs from "fs";
import path from "path";
import { downloadFromCloudinary, downloadFromHuggingFace } from "../Services/download.service.js"
import { extractAudio } from "../Services/audio.service.js"
import { generateCaptions } from "../Services/captions.service.js"
import { translate } from "../Services/translate.service.js"
import { generateTTS } from "../Services/tts.service.js"
import { Video } from "../Models/video.model.js";
import { parseSync, stringifySync } from "subtitle";
import { safeUnlink } from "../Utilities/helper.utility.js";
import { changeState, readJob } from "./job.services.js";
import { dequeue, markComplete, markFailed, markProcessing, toggleProcessing, unMarkProcessing } from "../../Data/Queue/queue.services.js";
const JOBS_DIR = path.join(process.cwd(), "Data", "Jobs");

const processJob = async function (jobId) {
  await dequeue();
  await markProcessing(jobId);
  let job = readJob(jobId);
  if (!job) throw new Error("Job is unavailable");
  let downloadPath;
  let audioPath;
  let captionPath;
  let vttPath;
  let ttsPath;
  let translatedCues;
  try {
    if (job.steps.download == "pending") {
      console.log("Downloading Started");
      downloadPath = await downloadFromCloudinary(job.url);
      if (!downloadPath) throw new Error("Unable to download the video file");
      else {
        changeState(jobId, "steps", "download", downloadPath);
        job = readJob(jobId);
      }
    }

    if (job.steps.audio == "pending") {
      console.log("Extracting Audio");
      audioPath = await extractAudio(job.steps.download);
      if (!audioPath) {
        console.log("Some problem with audio")
        throw new Error("Unable to extract audio");
      }
      else {
        changeState(jobId, "steps", "audio", audioPath);
        job = readJob(jobId);
      }
    }

    if (job.steps.caption == "pending") {
      console.log("Generating caption");
      captionPath = await generateCaptions(job.steps.audio);
      if (!captionPath) throw new Error("Unable to generate captions");
      else {
        changeState(jobId, "steps", "caption", captionPath);
        job = readJob(jobId);
      }
    }

    const srtContent = fs.readFileSync(captionPath, "utf-8");
    if (!srtContent) throw new Error("Unable to read srt file or blank");

    const video = await Video.findById(job.docId);
    if (!video) throw new Error("Unable to find the video in DB");

    video.originalCaptions = srtContent;
    const savedCaptions = await video.save({
      validateBeforeSave: false
    });
    if (!savedCaptions) throw new Error("Unable to save the captions in DB");

    const parsedSrt = parseSync(srtContent);
    if (!parsedSrt || !parsedSrt.length) throw new Error("Something went wrong while parsing srt");

    if (job.steps.translate == "pending") {
      console.log("Translating Started");
      translatedCues = await Promise.all(
        parsedSrt.map(async function (cue) {
          const translatedText = await translate(cue.data.text, "english", "hindi");
          return { ...cue, data: { ...cue.data, text: translatedText } };
        })
      );
      if (!translatedCues.length) throw new Error("No cues were translated");
      else {
        const translatedSrt = stringifySync(translatedCues, { format: "VTT" });
        vttPath = path.join(process.cwd(), "Public", "Temp", "Subtitles", `${path.basename(captionPath, path.extname(captionPath))}.vtt`);
        fs.writeFileSync(vttPath, translatedSrt);
        changeState(jobId, "steps", "translate", vttPath);
        job = readJob(jobId);
      }
    }

    if (job.steps.tts == "pending") {
      console.log("started tts");
      ttsPath = await Promise.all(
        translatedCues.map(async function (cue, index) {
          const text = cue.data.text;
          const path = await generateTTS(text, jobId, index);
          return path;
        }))[0];
      if (!ttsPath) throw new Error("Unable to generate tts");
      else {
        changeState(jobId, "steps", "tts", ttsPath);
      }

    }
    changeState(jobId, "status", "completed");
    await markComplete(jobId);
  } catch (error) {
    await markFailed(jobId);
    console.log(error.message);
    return error;
  }
  finally {
    safeUnlink(downloadPath);
    safeUnlink(audioPath);
    safeUnlink(captionPath);
    safeUnlink(vttPath)
    await unMarkProcessing();
  }
}

export { processJob };