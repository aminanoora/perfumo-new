import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import session from "express-session";

import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/user/authRoutes.js";
import profileRoutes from "./src/routes/user/profileRoutes.js";
import noCache from "./src/middleware/noCache.js";
import userRoutes from "./src/routes/admin/userRoutes.js";
import adminRoutes from "./src/routes/admin/adminRoutes.js";
import userdetailsRoutes from "./src/routes/admin/userdetailsRoutes.js";
import passport from "./src/config/passport.js";
import googleAuthRoutes from "./src/routes/user/googleAuthRoutes.js";
import categoryRoutes from "./src/routes/admin/categoryRoutes.js";
import brandRoutes from "./src/routes/admin/brandRoutes.js";
import productRoutes from "./src/routes/admin/productRoutes.js";
import shopRoutes from "./src/routes/user/shopRoutes.js";
import cartRoutes from "./src/routes/user/cartRoutes.js";
import cartCount from "./src/middleware/cartCount.js";
import wishlistRoutes from "./src/routes/user/wishlistRoutes.js";
import checkoutRoutes from "./src/routes/user/checkoutRoutes.js";
import orderRoutes from "./src/routes/admin/orderRoutes.js";
import inventoryRoutes from "./src/routes/admin/inventoryRoutes.js";
import couponRoutes from "./src/routes/admin/couponRoutes.js";
import analyticsRoute from "./src/routes/admin/analyticsRoutes.js";
import wishlistCount from "./src/middleware/wishlistCount.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(noCache);

app.use(express.static(path.join(__dirname, "src/public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());

app.use(passport.session());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.locals.user = req.session.user;

  next();
});

app.use(cartCount);

app.use(wishlistCount);

app.use("/auth", googleAuthRoutes);

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "src/views"));

app.use("/", authRoutes);

app.use("/", profileRoutes);

app.use("/shop", shopRoutes);

app.use("/admin", adminRoutes);

app.use("/admin", userRoutes);

app.use("/admin", userdetailsRoutes);
app.use("/admin", categoryRoutes);

app.use("/admin", brandRoutes);

app.use("/admin", productRoutes);

app.use("/admin", orderRoutes);

app.use("/admin", inventoryRoutes);

app.use("/cart", cartRoutes);

app.use("/wishlist", wishlistRoutes);

app.use("/checkout", checkoutRoutes);

app.use("/admin/coupons", couponRoutes);

app.use(
  "/admin/analytics",

  analyticsRoute,
);

app.use((req, res) => {
  res.status(404).render("user/error/404");
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).render("user/error/500");
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
