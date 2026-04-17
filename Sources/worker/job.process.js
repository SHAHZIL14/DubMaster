import fs from "fs";
import path from "path";
import fileSystem from "fs/promises";
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
import { uploadOnCloudinary } from "../Utilities/cloudinary.utility.js";
import { synchronizeSegment } from "../Services/syncSegment.service.js";
import { buildFinalAudio } from "../Services/audioOutput.service.js";
import { mergeAudioWithVideo } from "../Services/audioVideoMerge.service.js";


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
  // Paths -->
  let downloadPath;
  let audioPath;
  let captionPath;
  let vttPath;
  let ttsPaths;
  let translatedCues;
  let srtContent
  let audioOutput;
  let videoOutput;
  // Paths -->
  // Directories
  const ttsDir = path.join(process.cwd(), "Public", "Temp", "TTS", jobId);
  const sycnchronizedDir = path.join(process.cwd(), "Public", "Temp", "Synchronized", jobId);
  const audioDir = path.join(process.cwd(), "Public", "Temp", "Merge", jobId);
  const videoDir = path.join(process.cwd(), "Public", "Temp", "Output", jobId);
  // Directories
  // Global Variables -->
  let syncedAudioMeta = [];
  // Global Variables -->
  try {
    // -----------------Downloading the video-------------------//
    if (job.steps.download == "pending") {
      console.log("Downloading Started");
      downloadPath = await downloadFromCloudinary(job.url);
      if (!downloadPath) throw new Error("Unable to download the video file");
      else {
        changeState(jobId, "steps", "download", downloadPath);
        job = readJob(jobId);
      }
    }
    // -----------------Downloading the video-------------------//
    // -----------------Extracting the audio--------------------//

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
    // -----------------Extracting the audio--------------------//
    // -----------------Extracting the captions-----------------//
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
    // -----------------Extracting the captions-----------------//

    const parsedSrt = parseSync(srtContent);
    if (!parsedSrt || !parsedSrt.length) throw new Error("Something went wrong while parsing srt");
    // -----------------Translation the SRT-----------------//
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
    // -----------------Translation the SRT-----------------//
    // -----------Generating speech from translation--------//
    if (job.steps.tts == "pending") {
      console.log("started tts");
      ttsPaths = await Promise.all(
        translatedCues.map(async function (cue, index) {
          const text = cue.data.text;
          return await generateTTS(text, jobId, index);
        }));
      if (ttsPaths.length == 0) throw new Error("Unable to generate tts");
      changeState(jobId, "steps", "tts", "Done");
      job = readJob(jobId);
    }
    // -----------Generating speech from translation--------//
    // -----------Synchronizing the speech------------------//
    if (job.steps.synchronized == "pending") {
      console.log("synchronization started");
      const syncedPaths = await Promise.all(
        translatedCues.map(async (cue, index) => {
          let audioPath = ttsPaths[index];
          let targetDuration = cue.data.end - cue.data.start;
          let outputPath = await synchronizeSegment({
            audioPath,
            targetDuration,
            jobId,
            index
          });
          syncedAudioMeta.push({
            path: outputPath,
            start: cue.data.start,
            duration: targetDuration
          });
          return outputPath;
        })
      );
      if (syncedPaths.length == 0) throw new Error("unable to synchronize the audio files.");
      changeState(jobId, "steps", "synchronized", "Done");
      job = readJob(jobId);
    }
    // -----------Synchronizing the speech------------------//
    // -----------Merging audio clips ------------------//
    if (job.steps.audioOutput == "pending") {
      console.log("Merging all audio clips into one.");
      audioOutput = await buildFinalAudio(syncedAudioMeta, jobId);
      if (!audioOutput) throw new Error("Unable to merge the audio files.");
      changeState(jobId, "steps", "audioOutput", audioOutput);
      job = readJob(jobId);
    }
    // -----------Merging audio clips------------------//

    // -----------Merging audio with video------------------//
    if (job.steps.videoOutput == "pending") {
      console.log("Merging synched audio with video.");
      videoOutput = await mergeAudioWithVideo(downloadPath, audioOutput, jobId);
      if (!videoOutput) throw new Error("Unable to merge the audio file with video.");
      changeState(jobId, "steps", "videoOutput", videoOutput);
      job = readJob(jobId);
    }
    // -----------Merging audio with video------------------//

    // -----------Uploading video on cloud------------------//

    if (job.steps.upload == "pending") {
      const translatedVideoOnCloud = await uploadOnCloudinary(job.steps.videoOutput);
      if (translatedVideoOnCloud?.url) {
        video.translatedVideoUrl = translatedVideoOnCloud.url;
        const savedTranslatedVideoUrl = await video.save({
          validateBeforeSave: false
        });
        if (!savedTranslatedVideoUrl) throw new Error("Unable to save audio in DB");
        changeState(jobId, "steps", "upload", translatedVideoOnCloud.url);
      }
    }
    // -----------Uploading video on cloud------------------//
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
    safeUnlink(audioOutput);
    safeUnlink(videoOutput);
    safeUnlink(captionPath);
    safeUnlink(vttPath);
    await deleteFolder(ttsDir);
    await deleteFolder(sycnchronizedDir);
    await deleteFolder(audioDir);
    await deleteFolder(videoDir);
    await unMarkProcessing();
  }
}

export { processJob };