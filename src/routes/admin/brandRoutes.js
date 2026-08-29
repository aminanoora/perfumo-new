import express from "express";

import {
  getBrandsPage,
  loadAddBrand,
  addBrand,
  loadEditBrand,
  updateBrand,
  brandDetails,
  listBrand,
  unlistBrand,
  deleteBrand,
} from "../../controllers/admin/brandController.js";
import uploadBrand from "../../middleware/uploadBrand.js";
import adminAuth from "../../middleware/adminAuth.js";
import noCache from "../../middleware/noCache.js";

const router = express.Router();

router.get("/brand", adminAuth, noCache, getBrandsPage);

router.get("/brand/add", adminAuth, noCache, loadAddBrand);

router.post("/brand/add", adminAuth, uploadBrand.single("logo"), addBrand);

router.get("/brand/edit/:id", adminAuth, noCache, loadEditBrand);

router.post(
  "/brand/edit/:id",
  adminAuth,
  uploadBrand.single("logo"),
  updateBrand,
);

router.get("/brand/:id", adminAuth, noCache, brandDetails);

router.get("/brand/list/:id", adminAuth, listBrand);

router.get("/brand/unlist/:id", adminAuth, unlistBrand);

router.post("/brand/delete/:id", adminAuth, deleteBrand);

export default router;
