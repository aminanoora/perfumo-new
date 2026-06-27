import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    sku: {
        type: String,
        required: true,
        unique: true
    },

    sizeML: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    discountPrice: {
        type: Number,
        default: null
    },

    stockQuantity: {
        type: Number,
        required: true,
        default: 0
    },

    variantImage: {
        type: String,
        default: ""
    },

    isListed: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model("Variant", variantSchema);