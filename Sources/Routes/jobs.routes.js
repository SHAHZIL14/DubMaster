import { response, Router } from "express";
import { createJob, getJobStatus } from "../Controllers/jobs.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
const jobRouter = Router();

jobRouter.route("/:id/status").get(verifyJWT, getJobStatus);

jobRouter.route("").get(function (request, response) {
  response
    .status(200)
    .json(new apiResponse(200, null, "OK job root"))
});

export default jobRouter;