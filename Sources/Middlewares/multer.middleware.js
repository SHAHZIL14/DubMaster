import multer from "multer";
import path from "path";
import { apiError } from "../Utilities/apiError.utility.js";
import { getVideoDuration } from "../Utilities/video.utility.js"
// Modules

const Storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, "./Public/Temp");
  },
  filename: function (request, file, callback) {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
// Storage definition

const Upload = multer({
  storage: Storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: async function (request, file, callback) {
    const filetypes = /mp4|mov|avi|mkv/;
    const mimeType = filetypes.test(file.mimetype);
    const extension = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (!mimeType || !extension) throw new apiError(400, "Error: File upload only supports video formats!");
    if (file.size > 20480) throw new apiError(400, "File size exceeds the limit");
    callback(null, true);
  },
});
//Upload

export { Upload };
