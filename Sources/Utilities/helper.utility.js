import fs from "fs";

const safeUnlink = (filePath) => {
  try {
    if (!filePath) return;

    if (fs.existsSync(filePath)) {
      const stat = fs.lstatSync(filePath);

      // ✅ Only delete files (never folders)
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        console.log("🗑 Deleted:", filePath);
      } else {
        console.log("⚠️ Skipped (not a file):", filePath);
      }
    }
  } catch (err) {
    console.log("Cleanup error:", err.message);
  }
};

export { safeUnlink };

