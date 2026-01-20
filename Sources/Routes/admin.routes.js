import { Router } from "express";
import {getAdmin,getPendingUsers,approveUser,} from "../Controllers/admin.controller.js";
import {verifyJWT,isAdmin,} from "../Middlewares/auth.middleware.js";

const adminRouter = Router();

adminRouter.route("/panel").get(verifyJWT, isAdmin, getAdmin);

adminRouter.route("/pending").get(verifyJWT, isAdmin, getPendingUsers);

adminRouter.route("/users/:id/approve").put(verifyJWT, isAdmin, approveUser);

export default adminRouter;
