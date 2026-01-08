import mongoose from "mongoose";
import config from "../../configuration/config.js";


export const connect = async () => {
  try {
    await mongoose.connect(config.uri, {
      dbName: "Dubmaster_shazil_2003",
    });
    console.log("✅ MongoDB connected with Mongoose");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};
