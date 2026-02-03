import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { enqueue, readQueue } from "../../Data/Queue/queue.services.js";
import { apiError } from "../Utilities/apiError.utility.js";

const JOBS_DIR = path.join(process.cwd(), "Data", "Jobs");

const createJob = async (docId, url) => {
  if (!docId || !url) throw new Error("Document ID or Cloud url is missing");

  const jobId = randomUUID();

  const jobDir = path.join(JOBS_DIR, jobId);

  await fs.mkdir(jobDir, { recursive: true });

  const jobState = {
    jobId,
    docId,
    status: "created",
    createdAt: new Date().toISOString(),
    url: url || null,
    steps: {
      download: "pending",
      audio: "pending",
      caption: "pending",
      translate: "pending",
      tts: "pending"
    }
  };

  await fs.writeFile(
    path.join(jobDir, "job.json"),
    JSON.stringify(jobState, null, 2)
  );
  enqueue(jobId);
  return jobId;
};

const getJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new apiError(400, "Job id is missing");

  const queue = await readQueue();
  if (!queue) throw new apiError(500, "Unable to read the queue");

  let status = null;

  // Check arrays
  for (const [key, value] of Object.entries(queue)) {
    if (Array.isArray(value) && value.includes(id)) {
      status = key; // "waiting", "completed", "failed"
      break;
    }
  }

  // Check processing job separately
  if (!status && queue.processing_id === id) {
    status = "processing_id";
  }

  if (!status) {
    throw new apiError(404, "Video is unavailable, please try uploading again");
  }

  let message;
  switch (status) {
    case "waiting":
      message = "Your video is in the queue, please wait some time.";
      break;
    case "processing_id":
      message = "Your video is under process, about to complete.";
      break;
    case "completed":
      message = "Your video has been processed.";
      break;
    case "failed":
      message = "Unfortunately your video failed to process. Try again.";
      break;
    default:
      message = "Server error";
  }

  res.status(200).json(new apiResponse(200, { status }, message));
});


export { createJob, getJobStatus };
