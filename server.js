import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import session from 'express-session';

import { fileURLToPath } from 'url';

import connectDB from './src/config/db.js';

import authRoutes from './src/routes/user/authRoutes.js';
import profileRoutes from './src/routes/user/profileRoutes.js';
import noCache from './src/middleware/noCache.js';
import userRoutes from "./src/routes/admin/userRoutes.js";
import adminRoutes from './src/routes/admin/adminRoutes.js';
import userdetailsRoutes from './src/routes/admin/userdetailsRoutes.js';
import passport from './src/config/passport.js';
import googleAuthRoutes from './src/routes/user/googleAuthRoutes.js';
import categoryRoutes from   "./src/routes/admin/categoryRoutes.js"

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



connectDB();



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(noCache);


app.use(
  express.static(
    path.join(__dirname, 'src/public')
  )
);



app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000
    }
  })
);

app.use(passport.initialize());

app.use(passport.session());

app.use('/auth', googleAuthRoutes);

app.set('view engine', 'ejs');

app.set(
  'views',
  path.join(__dirname, 'src/views')
);

app.use((req, res, next) => {

    res.locals.user = req.session.user || null;

    next();
});

app.use('/', authRoutes);



app.use('/', profileRoutes);

app.use('/admin', adminRoutes);

app.use("/admin", userRoutes);

app.use('/admin',userdetailsRoutes);
app.use('/admin',categoryRoutes);

app.use((req, res, next) => {

    res.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
    );

    next();
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});