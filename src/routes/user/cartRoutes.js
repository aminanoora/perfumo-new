import express from "express";

import {
    loadCart,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    toggleGiftWrap
} from "../../controllers/user/cartController.js";

import userAuth from '../../middleware/userAuth.js';

const router = express.Router();

router.get(
    "/",
    userAuth,
    loadCart
);

router.post(
    "/add",
    userAuth,
    addToCart
);

router.patch(
    "/quantity",
    userAuth,
    updateCartQuantity
);

router.delete(
    "/remove/:itemId",
    userAuth,
    removeCartItem
);

router.patch(
    "/gift-wrap",
    userAuth,
    toggleGiftWrap
);

export default router;