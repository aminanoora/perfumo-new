import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    logo: {
        type: String,
        default: ""
    },

    description: {
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

},{
    timestamps:true
});

export default mongoose.model("Brand", brandSchema);