import { findNextJob, getQueue } from "../../Data/Queue/queue.services.js"
import { processJob } from "../worker/job.process.js"
import { cleanCompletedJobs } from "./job.services.js";

setInterval(async function () {
  const queue = await getQueue();
  if (queue.processing) return;
  await cleanCompletedJobs(queue)
  const jobId = await findNextJob();
  if (!jobId) return;
  await processJob(jobId);

}, 3000)

