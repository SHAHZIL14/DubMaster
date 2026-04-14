import fs from "fs";
import path from "path";
import fileSystemPromise from "fs/promises";

const JOB_DIR = path.join(process.cwd(), "Data", "Jobs");

const changeState = function (jobId, section, key, value) {
  const JOB_FILE = path.join(JOB_DIR, jobId, "job.json");

  const jobJSON = JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));

  if (section === "steps") {
    if (!jobJSON.steps) jobJSON.steps = {};
    jobJSON.steps[key] = value;
  } else {
    jobJSON[section] = key;
  }

  fs.writeFileSync(JOB_FILE, JSON.stringify(jobJSON, null, 2));
};

const readJob = function (jobId) {
  const JOB_FILE = path.join(JOB_DIR, jobId, "job.json");
  const jobJSON = JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));
  return jobJSON;
}

async function deleteWithRetry(jobPath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await fileSystemPromise.rm(jobPath, { recursive: true, force: true });
      return;
    } catch (err) {
      if (err.code === 'EBUSY') {
        await new Promise(res => setTimeout(res, 300));
      } else {
        throw err;
      }
    }
  }
}

async function cleanCompletedJobs(queue) {
  for (const jobId of queue.completed) {
    const JOB_PATH = path.join(process.cwd(), 'Data', 'Jobs', jobId);
    if (!fs.existsSync(JOB_PATH)) return;
    try {
      await deleteWithRetry(JOB_PATH);
      console.log(`Deleted: ${jobId}`);
    } catch (err) {
      console.error(`Failed: ${jobId}`, err);
    }
  }
}

export { changeState, readJob, cleanCompletedJobs }