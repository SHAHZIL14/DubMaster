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
  accessTokenSecret: process.env.ACCESSTOKENSECRET,
  accessTokenExpiry: process.env.ACCESSTOKENEXPIRY,
  refreshTokenSecret: process.env.REFRESHTOKENSECRET,
  refreshTokenExpiry: process.env.REFRESHTOKENEXPIRY,
  cloudinarySecret: process.env.CLOUDINARYSECRET,
  cloudinaryApiKey: process.env.CLOUDINARYAPIKEY,
  cloudinaryCloudName: process.env.CLOUDINARYCLOUDNAME,
  hfToken: process.env.HFTOKEN,
  geminiKey: process.env.GEMINIAPIKEY
};

export default config;
