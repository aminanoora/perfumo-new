import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';

import Admin from './src/models/Admin.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)

.then(async () => {

    const hashedPassword =
    await bcrypt.hash('admin#123', 10);

    const admin = new Admin({

        email: 'admin@gmail.com',

        password: hashedPassword
    });

    await admin.save();

    console.log('Admin created');

    process.exit();

});