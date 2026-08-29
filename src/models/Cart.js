import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  variant: {
    type: mongoose.Schema.Types.ObjectId,

    ref: "Variant",

    required: true,
  },

  quantity: {
    type: Number,

    default: 1,

    min: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,
    },

    items: [cartItemSchema],

    giftWrap: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Cart", cartSchema);
