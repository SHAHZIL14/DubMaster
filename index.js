import express from "express";
import config from "./configuration/config.js";
const app = express();

app.get("/", function (request, respond) {
  respond.send("The Dubmaster root endpoint");
});

app.get("/auth", function (request, respond) {
  respond.send("This is the auth endpoint");
});

app.listen(config.port, function () {
  console.log("The app has started listening on port : 8000");
});
