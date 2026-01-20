import { Router } from "express";
import {registerUser,loginUser,getCurrentUser,logoutUser,} from "../Controllers/auth.controller.js";
import {verifyJWT,isApproved} from "../Middlewares/auth.middleware.js";
import { loginLimiter } from "../Middlewares/limiter.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginLimiter, loginUser);

userRouter.route("/logout").post(verifyJWT, logoutUser);

userRouter.route("/me").get(verifyJWT, isApproved, getCurrentUser);

export default userRouter;
