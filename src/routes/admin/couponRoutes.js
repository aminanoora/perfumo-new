import express from "express";

import {

    loadCoupons,

    addCoupon,

    loadEditCoupon,

    updateCoupon,

    toggleCouponStatus

} from "../../controllers/admin/couponController.js";

const router = express.Router();

router.get("/", loadCoupons);

router.get("/add", (req, res) => {

    res.render("admin/coupons/add-coupons", {
        active: "coupons"
    });

});

router.post("/add", addCoupon);

router.get("/view/:id", loadEditCoupon);

router.post("/view/:id", updateCoupon);

router.patch("/toggle/:id", toggleCouponStatus);

export default router;