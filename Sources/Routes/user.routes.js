import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../Controllers/auth.controller.js";
import {
  getAdmin,
  getPendingUsers,
  approveUser,
} from "../Controllers/admin.controller.js";
import {
  verifyJWT,
  isAdmin,
  isApproved,
} from "../Middlewares/auth.middleware.js";
import {loginLimiter} from "../Middlewares/limiter.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginLimiter, loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/me").get(verifyJWT, isApproved, getCurrentUser);

router.route("/admin").get(verifyJWT, isAdmin, getAdmin);

router.route("/admin/users/pending").get(verifyJWT, isAdmin, getPendingUsers);

router.route("/admin/users/:id/approve").put(verifyJWT, isAdmin, approveUser);

export default router;
