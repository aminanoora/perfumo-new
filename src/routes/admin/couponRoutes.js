import express from "express";

import adminAuth from "../../middleware/adminAuth.js";

import {
  loadCoupons,
  addCoupon,
  loadEditCoupon,
  updateCoupon,
  toggleCouponStatus,
} from "../../controllers/admin/couponController.js";

const router = express.Router();

router.get("/", adminAuth, loadCoupons);

router.get("/add", adminAuth, (req, res) => {
  res.render("admin/coupons/add-coupons", {
    active: "coupons",
  });
});

router.post("/add", adminAuth, addCoupon);

router.get("/view/:id", adminAuth, loadEditCoupon);

router.post("/view/:id", adminAuth, updateCoupon);

router.patch("/toggle/:id", adminAuth, toggleCouponStatus);

export default router;
