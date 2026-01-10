import express, { urlencoded } from "express";
import config from "./Configuration/config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./Sources/Routes/user.routes.js";
import { connect } from "./Sources/Database/db.connect.js";
// Modules

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: "true", limit: "16kb" }));
app.use(cors({ credentials: "true" }));
app.use(cookieParser());
// Middlewares

app.use("/api/v1/user", router);
// User routes

app.get("/", function (request, respond) {
  respond.send("This is the root endpoint");
});
// ROOT!

// Routes

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
