import { Router } from "express";
import { isApproved, verifyJWT } from "../Middlewares/auth.middleware.js";
import { uploadVideo, deleteVideo, captionGeneration } from "../Controllers/video.controller.js";
import { Upload } from "../Middlewares/multer.middleware.js";

const videoRouter = Router();

videoRouter.route("/upload").post(verifyJWT, isApproved, Upload.single("video"), uploadVideo);

videoRouter.route("/:v_id/delete").delete(verifyJWT, isApproved, deleteVideo);

videoRouter.route("/:v_id/caption").get(verifyJWT, isApproved, captionGeneration);

export default videoRouter;
