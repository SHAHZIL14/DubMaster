import mongoose from "mongoose";
//Modules

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    publicId: {
      type: String,
      required: true
    },
    
    originalVideoUrl: {
      type: String,
      required: true,
    },

    originalFileName: {
      type: String,
    },

    duration: {
      type: Number,
      required: true,
    },

    size: {
      type: Number,
    },

    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "caption_extracted",
        "translated",
        "tts_generated",
        "completed",
        "failed",
        "expired",
      ],
      default: "uploaded",
      index: true,
    },

    captions: {
      type: String,
    },

    translatedText: {
      type: String,
    },

    audioUrl: {
      type: String,
    },

    failureReason: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    processingStartedAt: Date,
    processingCompletedAt: Date,
  },
  { timestamps: true }
);
//Schema

videoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//Methods

export const Video = mongoose.model("Video", videoSchema);
