import express, { urlencoded } from "express";
import config from "./Configuration/config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./Sources/Routes/user.routes.js";
import adminRouter from "./Sources/Routes/admin.routes.js";
import videoRouter from "./Sources/Routes/video.routes.js";
import { connect } from "./Sources/Database/db.connect.js";
// Modules

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: "true", limit: "16kb" }));
app.use(cors({ credentials: "true" }));
app.use(cookieParser());
app.set("trust proxy", 1);
// Middlewares

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/video/", videoRouter);
// User routes\

app.get("/", function (request, respond) {
  respond.send("This is the root endpoint");
});
// ROOT!

app.get("/ip-test", (request, response) => {
  response.json({ ip: request.ip });
});
// Routes

// This MUST have 4 arguments (err, req, res, next)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${statusCode} - ${message}`);
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

connect()
  .then(function () {
    app.listen(config.port, function () {
      console.log("The app has started listening on port : 8000");
    });
  })
  .catch(function (error) {
    console.log(
      "Server failed to listen as database failed to connect with error: ",
      error
    );
  });
