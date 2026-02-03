import { findNextJob, getQueue } from "../../Data/Queue/queue.services.js"
import { processJob } from "../worker/job.process.js"
setInterval(async function () {
  const queue = await getQueue();
  if (queue.processing) return;
  const jobId = await findNextJob();
  if (!jobId) return;
  await processJob(jobId);
}, 3000)

