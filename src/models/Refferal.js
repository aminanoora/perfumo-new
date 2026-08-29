import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referralCode: {
      type: String,
      required: true,
    },

    rewardAmount: {
      type: Number,
      default: 50,
    },

    referrerRewarded: {
      type: Boolean,
      default: true,
    },

    referredRewarded: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["Completed"],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Referral", referralSchema);
