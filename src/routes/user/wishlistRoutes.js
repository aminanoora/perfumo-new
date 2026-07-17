import express from "express";

import {
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart
} from "../../controllers/user/wishlistController.js";

import userAuth from "../../middleware/userAuth.js";


const router = express.Router();

router.get("/", userAuth, loadWishlist);

router.post("/add", userAuth, addToWishlist);

router.post("/remove", userAuth, removeFromWishlist);

router.post("/move-to-cart", userAuth, moveToCart);

export default router;