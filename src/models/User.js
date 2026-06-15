import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        unique: true,
        sparse: true

    },

    password: {
        type: String,
       
    },

    isBlocked: {
        type: Boolean,
        default: false
    },
    otp: String,

       otpExpiry: Date,

    isVerified: {
    type: Boolean,
    default: false
},
authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
},
googleId: {
    type: String
},

}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;