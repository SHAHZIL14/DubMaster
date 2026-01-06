import dotenv from "dotenv";
dotenv.config();

const enVariables = ["PORT"];

enVariables.forEach((enVariable) => {
  if (!process.env[enVariable]) {
    throw new Error(`Error at configuration , ${enVariable} is not configured`);
  }
});

const config = {
  port: parseInt(process.env.PORT, 10),
};

export default config;
