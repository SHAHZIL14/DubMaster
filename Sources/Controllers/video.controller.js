import fs from "fs";
import mongoose from "mongoose";
import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import { extractAudio } from "../Services/audio.service.js";
import { generateCaptions } from "../Services/captions.service.js";
import { createJob } from "./jobs.controller.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../Utilities/cloudinary.utility.js";
import { safeUnlink } from "../Utilities/helper.utility.js";
import { Video } from "../Models/video.model.js";
import { getVideoDuration } from "../Services/duration.service.js";

const uploadVideo = asyncHandler(async function (request, response) {
  const file = request.file;

  if (!file) {
    throw new apiError(400, "No file uploaded");
  }

  if (!file.mimetype.startsWith("video/")) {
    fs.unlinkSync(file.path);
    throw new apiError(400, "Only video files are allowed");
  }

  const duration = await getVideoDuration(file.path);

  if (duration > 10) {
    fs.unlinkSync(file.path);
    throw new apiError(400, "Video length exceeds the limit of 10 seconds.");
  }

  const videoOnCloud = await uploadOnCloudinary(file.path);

  if (!videoOnCloud?.url) {
    throw new apiError(500, "Cloudinary upload failed");
  }

  const fileSize = Number((videoOnCloud.bytes / (1024 * 1024)).toFixed(2));
  const expiryDate = new Date(Date.now() + 3 * 60 * 60 * 1000);

  const video = await Video.create({
    userId: request.user._id,
    publicId: videoOnCloud.public_id,
    originalVideoUrl: videoOnCloud.url,
    originalFileName: videoOnCloud.original_filename,
    duration,
    size: fileSize,
    status: "uploaded",
    expiresAt: expiryDate,
  });

  const job = await createJob(video._id, video.originalVideoUrl);
  if (!job) throw new apiError(500, "Unable to create new job");


  response.status(201).json(
    new apiResponse(
      201,
      { id: video._id, url: video.originalVideoUrl },
      `Video uploaded successfully and job created with ID:${job}`
    )
  );
});


const deleteVideo = asyncHandler(async function (request, response) {
  const { v_id } = request.params;
  if (!mongoose.Types.ObjectId.isValid(v_id)) {
    throw new apiError(400, "Invalid video id format");
  }

  const video = await Video.findById(v_id);
  if (!video) throw new apiError(404, "Video not found");
  if (video.user.toString() !== request.user._id.toString()) {
    throw new apiError(403, "You are not allowed to delete this video");
  }
  if (!video.publicId) {
    throw new apiError(500, "PublicId missing in video document");
  }

  const cloudResponse = await deleteFromCloudinary(video.publicId);
  if (!cloudResponse || cloudResponse.result !== "ok") {
    throw new apiError(500, "Failed to delete video from Cloudinary");
  }

  await video.deleteOne();

  return response.status(204).send();
});


const captionGeneration = asyncHandler(async function (request, response) {
  const { v_id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(v_id)) {
    throw new apiError(400, "Invalid video id format");
  }

  const video = await Video.findById(v_id);
  if (!video) {
    throw new apiError(404, "Requested video is not available");
  }

  let downloadedPath;
  let audioPath;
  let captionPath;

  try {

    downloadedPath = await downloadFromCloudinary(video.originalVideoUrl);
    if (!downloadedPath) {
      throw new apiError(500, "Failed to download video from cloud");
    }

    audioPath = await extractAudio(downloadedPath);
    if (!audioPath) {
      throw new apiError(500, "Failed to extract audio from video");
    }

    captionPath = await generateCaptions(audioPath);
    if (!captionPath) {
      throw new apiError(500, "Failed to generate captions");
    }

    const srtContent = fs.readFileSync(captionPath, "utf8");
    if (!srtContent) throw new apiError(500, "Something went wrong while reading the srt");

    // video.captions = srtContent;
    // const captionSaved = await video.save({
    //   validateBeforeSave: false
    // });
    // if (!captionSaved) throw new apiError(500, "Unable to save captions");

    response.status(200).json(
      new apiResponse(200, { srtContent }, "TranslatedCaptions generated successfully")
    );
    // const parsedSrt = parseSync(srtContent);
    // if (!parsedSrt || !parsedSrt.length) throw new apiError(500, "Something went wrong while parsing srt");

    // const translatedCues = await Promise.all(
    //   parsedSrt.map(async function (cue) {
    //     const translatedText = await translate(cue.data.text, "english", "hindi");
    //     return { ...cue, data: { ...cue.data, text: translatedText } };
    //   })
    // );

    // if (!translatedCues.length) throw new apiError(500, "No cues were translated");

    // const translatedSrt = stringifySync(translatedCues, { format: "SRT" });

    // const vttPath = path.join(process.cwd(), "Public", "Temp", "Subtitles", `${path.basename(captionPath, path.extname(captionPath))}.vtt`);
    // fs.writeFileSync(vttPath, translatedSrt);

  } finally {
    safeUnlink(captionPath);
    safeUnlink(downloadedPath);
    safeUnlink(audioPath);
    safeUnlink(downloadedPath)
  }
});

export { uploadVideo, deleteVideo, captionGeneration };
