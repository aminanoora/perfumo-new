import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,

      required: true,

      unique: true,

      uppercase: true,

      trim: true,
    },

    description: {
      type: String,

      required: true,

      trim: true,
    },

    discountType: {
      type: String,

      enum: ["percentage", "fixed"],

      required: true,
    },

    discount: {
      type: Number,

      required: true,

      min: 1,
    },

    minimumPurchase: {
      type: Number,

      default: 0,

      min: 0,
    },

    maximumDiscount: {
      type: Number,

      default: 0,
    },

    usageLimit: {
      type: Number,

      default: 0,
    },

    usedCount: {
      type: Number,

      default: 0,
    },

    validFrom: {
      type: Date,

      required: true,
    },

    validUntil: {
      type: Date,

      required: true,
    },

    isActive: {
      type: Boolean,

      default: true,
    },

    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "User",
        },

        usedAt: {
          type: Date,

          default: Date.now,
        },
      },
    ],
  },

  {
    timestamps: true,
  },
);

couponSchema.index({
  description: "text",
});
export default mongoose.model("Coupon", couponSchema);
