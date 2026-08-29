import express from "express";

import {
  getProductsPage,
  loadAddProduct,
  addProduct,
  loadAddVariant,
  addVariant,
  deleteVariant,
  loadEditVariant,
  updateVariant,
  loadProductDetails,
  updateProduct,
  softDeleteProduct,
  toggleProductListing,
} from "../../controllers/admin/productController.js";
import uploadProduct from "../../middleware/uploadProduct.js";
import adminAuth from "../../middleware/adminAuth.js";
import noCache from "../../middleware/noCache.js";

const router = express.Router();

router.get("/product", adminAuth, noCache, getProductsPage);

router.get("/product/add-product", adminAuth, noCache, loadAddProduct);

router.post(
  "/product/add-product",
  adminAuth,
  uploadProduct.array("variantImages", 50),
  addProduct,
);

router.get(
  "/product/:productId/add-variant",
  adminAuth,
  noCache,
  loadAddVariant,
);

router.post(
  "/product/:productId/add-variant",
  adminAuth,
  uploadProduct.array("images", 5),
  addVariant,
);

router.delete("/variant/:id", adminAuth, deleteVariant);
router.get("/variant/:variantId/edit", adminAuth, noCache, loadEditVariant);

router.post(
  "/variant/:variantId/edit",
  adminAuth,
  uploadProduct.array("images", 5),
  updateVariant,
);

router.get(
  "/product/:productId/details",
  adminAuth,
  noCache,
  loadProductDetails,
);

router.post("/product/:productId/update", adminAuth, updateProduct);

router.post("/product/:productId/delete", adminAuth, softDeleteProduct);

router.post("/product/:productId/toggle-list", adminAuth, toggleProductListing);

export default router;
