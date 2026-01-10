import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../Configuration/config.js";
//Modules

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
// Schema

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});
// Middleware

userSchema.methods.passwordCheck = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    config.refreshTokenSecret,
    {
      expiresIn: config.refreshTokenExpiry,
    }
  );
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    config.accessTokenSecret,
    {
      expiresIn: config.accessTokenExpiry,
    }
  );
};
// Methods

export const User = mongoose.model("User", userSchema);
