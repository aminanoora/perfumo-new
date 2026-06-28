import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },

    description: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    isListed: {
        type: Boolean,
        default: true
    },
      isDeleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

export default mongoose.model("Category", categorySchema);