import fs from "fs";
import path from "path";
import { downloadFromCloudinary, downloadFromHuggingFace } from "../Services/download.service.js"
import { extractAudio } from "../Services/audio.service.js"
import { generateCaptions } from "../Services/captions.service.js"
import { translate } from "../Services/translate.service.js"
import { generateTTS } from "../Services/tts.service.js"
import { synchronize } from "../Services/synchronizer.services.js";
import { mergeAudio } from "../Services/merge.service.js";
import { Video } from "../Models/video.model.js";
import { parseSync, stringifySync } from "subtitle";
import { safeUnlink } from "../Utilities/helper.utility.js";
import { changeState, readJob } from "./job.services.js";
import { dequeue, markComplete, markFailed, markProcessing, toggleProcessing, unMarkProcessing } from "../../Data/Queue/queue.services.js";
import { uploadOnCloudinary } from "../Utilities/cloudinary.utility.js";
import { generateWithSplit } from "../Services/split.service.js";
import { mergeAudioVideo } from "../Services/audioVideoMerge.js";

import fileSystem from "fs/promises";

async function deleteFolder(dirPath) {
  try {
    await fileSystem.rm(dirPath, { recursive: true, force: true });
    console.log("Deleted successfully");
  } catch (err) {
    console.error(err);
  }
}

const JOBS_DIR = path.join(process.cwd(), "Data", "Jobs");

const processJob = async function (jobId) {
  await dequeue();
  await markProcessing(jobId);
  let job = readJob(jobId);
  const video = await Video.findById(job.docId);
  if (!video) throw new Error("Unable to find the video in DB");
  if (!job) throw new Error("Job is unavailable");
  let downloadPath;
  let audioPath;
  let captionPath;
  let vttPath;
  let ttsPaths;
  let translatedCues;
  let srtContent
  let finalAudioPath;
  let mergePath;
  let outputPath = path.join(process.cwd(), "Public", "Temp", "Output", `${jobId}.mp4`);;
  let silenceDir = path.join(process.cwd(), "Public", "Temp", "Silence");
  let mergeDir = path.join(process.cwd(), "Public", "Temp", "Merge", jobId);
  let ttsDir = path.join(process.cwd(), "Public", "Temp", "TTS", jobId);
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
        srtContent = fs.readFileSync(captionPath, "utf-8");
        if (!srtContent) throw new Error("Unable to read srt file or blank");
        console.log(srtContent);
        video.originalCaptions = srtContent;
        const savedCaptions = await video.save({
          validateBeforeSave: false
        });
        if (!savedCaptions) throw new Error("Unable to save the captions in DB");
        changeState(jobId, "steps", "caption", captionPath);
        job = readJob(jobId);
      }
    }

    const parsedSrt = parseSync(srtContent);
    if (!parsedSrt || !parsedSrt.length) throw new Error("Something went wrong while parsing srt");
    console.log("srtContent = ", srtContent);
    console.log("parsedSrt = ", parsedSrt);

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
        if (!translatedSrt) throw new Error("Unable to parse the translated captions");
        video.translatedCaptions = translatedSrt;
        const savedTranslatedCaptions = await video.save({
          validateBeforeSave: false
        });
        if (!savedTranslatedCaptions) throw new Error("Unable to save the translated captions in DB");
        vttPath = path.join(process.cwd(), "Public", "Temp", "Subtitles", `${path.basename(captionPath, path.extname(captionPath))}.vtt`);
        fs.writeFileSync(vttPath, translatedSrt);
        changeState(jobId, "steps", "translate", vttPath);
        job = readJob(jobId);
      }
    }

    if (job.steps.tts == "pending") {
      console.log("started tts");
      ttsPaths = await Promise.all(
        translatedCues.map(async function (cue, index) {
          const text = cue.data.text;
          return await generateWithSplit(text, jobId, index);
        }));
      if (ttsPaths.length == 0) throw new Error("Unable to generate tts");
      else {
        ttsPaths = ttsPaths.flat();
        mergePath = await mergeAudio(ttsPaths, jobId);
        if (!mergePath) throw new Error("Unable to merge the generated audio files");
        changeState(jobId, "steps", "tts", mergePath);
        job = readJob(jobId);
      }
    }

    if (job.steps.synchronize == "pending") {
      console.log("synchronization started");
      const syncAudioPath = path.join(process.cwd(), "Public", "Temp", "Synchronized", `${jobId}.wav`);
      finalAudioPath = await synchronize(mergePath, downloadPath, syncAudioPath);
      if (!finalAudioPath) throw new Error("Unable to synchronize the audio file.");
      changeState(jobId, "steps", "synchronize", finalAudioPath);
      job = readJob(jobId);
    }

    if (job.steps.merge == "pending") {
      console.log("Merging synched audio with video");
      outputPath = await mergeAudioVideo(downloadPath, finalAudioPath, outputPath);
      if (!outputPath) throw new Error("Unable to merge the audio file with video.");
      changeState(jobId, "steps", "merge", outputPath);
      job = readJob(jobId);
    }

    if (job.steps.upload == "pending") {
      const translatedVideoOnCloud = await uploadOnCloudinary(job.steps.merge);
      if (translatedVideoOnCloud?.url) {
        video.translatedVideoUrl = translatedVideoOnCloud.url;
        const savedTranslatedVideoUrl = await video.save({
          validateBeforeSave: false
        });
        if (!savedTranslatedVideoUrl) throw new Error("Unable to save audio in DB");
        changeState(jobId, "steps", "upload", translatedVideoOnCloud.url);
      }
    }

    changeState(jobId, "status", "completed");
    await markComplete(jobId);
    console.log("FINAL OUTPUT PATH:", outputPath);
  } catch (error) {
    await markFailed(jobId);
    console.log(error.message);
    return error;
  }
  finally {
    safeUnlink(downloadPath);
    safeUnlink(audioPath);
    safeUnlink(finalAudioPath);
    safeUnlink(outputPath);
    safeUnlink(captionPath);
    safeUnlink(vttPath)
    await deleteFolder(silenceDir);
    await deleteFolder(mergeDir);
    await deleteFolder(ttsDir);
    await unMarkProcessing();
  }
}

export { processJob };