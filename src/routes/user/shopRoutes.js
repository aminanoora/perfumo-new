import express from "express";
import {
  loadShop,
  loadProductDetails,
} from "../../controllers/user/shopController.js";

const router = express.Router();

router.get("/", loadShop);

router.get("/product-details/:id", loadProductDetails);
export default router;
