import { Router } from "express";

const router = Router();

router.route("/register").get(function (req, res) {
  res.send("it is a registration page");
});

export default router;
