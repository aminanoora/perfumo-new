import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true
    },

    description: {
        type: String,
        required: true
    },

    topNotes: [{
        type: String
    }],

    heartNotes: [{
        type: String
    }],

    baseNotes: [{
        type: String
    }],

    occasion: [{
        type: String
    }],

    images: {

        type: [String],

        validate: {

            validator: function(images) {

                return images.length >= 3;

            },

            message: "Minimum 3 images required."

        }

    },

    isListed: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model("Product", productSchema);