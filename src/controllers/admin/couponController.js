import * as couponService from "../../services/admin/couponService.js";

export const loadCoupons = async (req, res) => {
  try {
    const result = await couponService.getCoupons(req.query);

    const message = req.session.message;

    delete req.session.message;

    res.render("admin/coupons/coupons", {
      coupons: result.coupons,

      currentPage: result.currentPage,

      totalPages: result.totalPages,

      totalCoupons: result.totalCoupons,

      search: result.search,

      status: result.status,

      activeCoupons: result.activeCoupons,
      expiredCoupons: result.expiredCoupons,
      disabledCoupons: result.disabledCoupons,

      sort: result.sort,

      message,

      active: "coupons",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/dashboard");
  }
};

export const addCoupon = async (req, res) => {
  try {
    const {
      code,

      description,

      discountType,

      discount,

      minimumPurchase,

      maximumDiscount,

      usageLimit,

      validFrom,

      validUntil,

      isActive,
    } = req.body;

    if (
      !code ||
      !description ||
      !discountType ||
      !discount ||
      !validFrom ||
      !validUntil
    ) {
      return res.json({
        success: false,

        message: "Please fill all required fields.",
      });
    }
    let maxDiscount = maximumDiscount;

    if (discountType === "fixed") {
      maxDiscount = 0;
    }

    if (new Date(validFrom) >= new Date(validUntil)) {
      return res.json({
        success: false,

        message: "Expiry date must be after start date.",
      });
    }

    if (discountType === "percentage" && discount > 100) {
      return res.json({
        success: false,

        message: "Percentage discount cannot exceed 100%.",
      });
    }

    if (minimumPurchase < 0) {
      return res.json({
        success: false,

        message: "Minimum purchase cannot be negative.",
      });
    }

    if (usageLimit < 0) {
      return res.json({
        success: false,

        message: "Usage limit cannot be negative.",
      });
    }

    if (discountType === "percentage" && maximumDiscount < 0) {
      return res.json({
        success: false,

        message: "Maximum discount cannot be negative.",
      });
    }
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (new Date(validUntil) < today) {
      return res.json({
        success: false,

        message: "Coupon expiry date cannot be in the past.",
      });
    }

    await couponService.createCoupon({
      code,

      description,

      discountType,

      discount,

      minimumPurchase,

      maximumDiscount: maxDiscount,

      usageLimit,

      validFrom,

      validUntil,

      isActive,
    });

    return res.json({
      success: true,

      message: "Coupon created successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: error.message,
    });
  }
};

export const loadEditCoupon = async (req, res) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);

    if (!coupon) {
      return res.redirect("/admin/coupons");
    }

    res.render("admin/coupons/coupon-details", {
      coupon,

      active: "coupons",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/coupons");
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const {
      code,

      description,

      discountType,

      discount,

      minimumPurchase,

      maximumDiscount,

      usageLimit,

      validFrom,

      validUntil,

      isActive,
    } = req.body;

    if (
      !code ||
      !description ||
      !discountType ||
      !discount ||
      !validFrom ||
      !validUntil
    ) {
      return res.json({
        success: false,

        message: "Please fill all required fields.",
      });
    }

    let maxDiscount = maximumDiscount;

    if (discountType === "fixed") {
      maxDiscount = 0;
    }

    if (new Date(validFrom) >= new Date(validUntil)) {
      return res.json({
        success: false,

        message: "Expiry date must be after start date.",
      });
    }

    if (discountType === "percentage" && discount > 100) {
      return res.json({
        success: false,

        message: "Percentage discount cannot exceed 100%.",
      });
    }
    if (minimumPurchase < 0) {
      return res.json({
        success: false,
        message: "Minimum purchase cannot be negative.",
      });
    }

    if (usageLimit < 0) {
      return res.json({
        success: false,
        message: "Usage limit cannot be negative.",
      });
    }

    if (discountType === "percentage" && maximumDiscount < 0) {
      return res.json({
        success: false,
        message: "Maximum discount cannot be negative.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(validUntil) < today) {
      return res.json({
        success: false,
        message: "Coupon expiry date cannot be in the past.",
      });
    }

    await couponService.updateCoupon(
      req.params.id,

      {
        code,

        description,

        discountType,

        discount,

        minimumPurchase,

        maximumDiscount: maxDiscount,

        usageLimit,

        validFrom,

        validUntil,

        isActive,
      },
    );

    return res.json({
      success: true,

      message: "Coupon updated successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: error.message,
    });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await couponService.toggleCouponStatus(req.params.id);

    return res.json({
      success: true,

      message: coupon.isActive
        ? "Coupon enabled successfully."
        : "Coupon disabled successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: error.message,
    });
  }
};
