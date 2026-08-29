import express from "express";
import * as checkoutController from "../../controllers/user/checkoutController.js";
import userAuth from "../../middleware/userAuth.js";
import * as addressController from "../../controllers/user/profileController.js";

const router = express.Router();

router.get("/", userAuth, checkoutController.loadCheckout);

router.post("/apply-coupon", userAuth, checkoutController.applyCoupon);
router.post("/remove-coupon", checkoutController.removeCoupon);

router.post("/place-order", userAuth, checkoutController.placeOrder);

router.post(
  "/create-pending-order",
  userAuth,
  checkoutController.createPendingOrder,
);

router.post("/create-order", userAuth, checkoutController.createRazorpayOrder);

router.post("/verify-payment", userAuth, checkoutController.verifyPayment);

router.post("/apply-referral", userAuth, checkoutController.applyReferral);

router.get(
  "/address/add-address",
  userAuth,
  addressController.loadAddAddressPage,
);
router.post("/address/add-address", userAuth, addressController.addAddress);

router.get(
  "/address/edit-address/:id",
  userAuth,
  addressController.loadEditAddressPage,
);

router.post(
  "/address/edit-address/:id",
  userAuth,
  addressController.updateAddress,
);

router.get(
  "/order-success/:orderId",
  userAuth,
  checkoutController.loadOrderSuccess,
);

router.get(
  "/payment-failed/:orderId",
  userAuth,
  checkoutController.loadPaymentFailed,
);

router.get(
  "/retry-payment/:orderId",

  userAuth,

  checkoutController.retryPayment,
);

export default router;
