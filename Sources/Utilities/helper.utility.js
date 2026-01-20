import fs from "fs";
import { parse, stringify } from "subtitle";

const safeUnlink = function (filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Cleanup failed:", err.message);
  }
};

export { safeUnlink };