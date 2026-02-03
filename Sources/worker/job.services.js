import fs from "fs";
import path from "path";

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


export { changeState , readJob }