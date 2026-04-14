import dotenv from "dotenv";
dotenv.config();

const enVariables = [
  "PORT",
  "URI",
  "ACCESSTOKENSECRET",
  "REFRESHTOKENSECRET",
  "ACCESSTOKENEXPIRY",
  "REFRESHTOKENEXPIRY",
  "CLOUDINARYSECRET",
  "CLOUDINARYAPIKEY",
  "CLOUDINARYCLOUDNAME",
  "HFTOKEN",
  "GEMINIAPIKEY"
];

enVariables.forEach(function (enVariable) {
  if (!process.env[enVariable]) {
    throw new Error(`Error at configuration , ${enVariable} is not configured`);
  }
});

const config = {
  port: parseInt(process.env.PORT, 10),
  uri: process.env.URI,
  accessTokenSecret: "",
  accessTokenExpiry: "",
  refreshTokenSecret: "",
  refreshTokenExpiry: "",
  cloudinarySecret: "",
  cloudinaryApiKey: "",
  cloudinaryCloudName: "",
  hfToken: "",
  geminiKey: ""
};

export default config;
