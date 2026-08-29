import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    topNotes: [
      {
        type: String,
      },
    ],

    heartNotes: [
      {
        type: String,
      },
    ],

    baseNotes: [
      {
        type: String,
      },
    ],

    occasion: [
      {
        type: String,
        enum: [
          "Daily wear",
          "Date night",
          "formal/office",
          "Summer/Beach",
          "Night Out",
        ],
      },
    ],
    featuredType: {
      type: String,
      enum: [
        "bestseller",
        "hidden",
        "budget",
        "limited",
        "trending",
        "newarrival",
      ],
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isListed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Product", productSchema);
