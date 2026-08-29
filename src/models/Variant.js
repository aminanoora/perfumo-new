import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },

    concentration: {
      type: String,
      required: true,
      enum: ["EDP", "EDT", "EDC", "Mist/Fraiche"],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Sale price cannot be greater than the regular price.",
      },
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    weight: {
      type: Number,
      required: true,
      min: 1,
    },

    images: {
      type: [String],
      validate: {
        validator: function (images) {
          return images.length >= 3 && images.length <= 5;
        },
        message: "Upload a minimum of 3 and maximum of 5 images.",
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

variantSchema.index(
  {
    product: 1,
    size: 1,
    concentration: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("Variant", variantSchema);
