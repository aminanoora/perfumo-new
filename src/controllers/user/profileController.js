import User from "../../models/User.js";

import Address from "../../models/Address.js";

import { sendOTP } from "../../services/mailService.js";

import bcrypt from "bcrypt";


import Cart from "../../models/Cart.js";

import Order from "../../models/Order.js";

import Product from "../../models/Product.js";

import Variant from "../../models/Variant.js";

import Wallet from "../../models/Wallet.js";

import Referral from "../../models/Refferal.js";

import Coupon from "../../models/Coupon.js";

import * as profileService from "../../services/user/profileService.js";

export const loadProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    res.render("user/profile/profile", {
      user,
      isGoogleUser: !!user.googleId,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    if (user.googleId) {
      return res.json({
        success: false,

        message: "Google accounts cannot update profile details.",
      });
    }

    const nameRegex = /^[A-Za-z\s'-]+$/;

    if (!nameRegex.test(firstName.trim())) {
      return res.json({
        success: false,
        message: "First name should contain only letters",
      });
    }

    if (!nameRegex.test(lastName.trim())) {
      return res.json({
        success: false,
        message: "Last name should contain only letters",
      });
    }
    const emailChanged = user.email !== email;

    if (!emailChanged) {
      user.firstName = firstName;
      user.lastName = lastName;

      await user.save();

      req.session.user.firstName = user.firstName;
      req.session.user.lastName = user.lastName;

      return res.json({
        success: true,
        message: "Profile updated successfully",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingEmail) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    req.session.pendingEmailChange = {
      userId: user._id.toString(),

      firstName: firstName.trim(),

      lastName: lastName.trim(),

      email: normalizedEmail,

      createdAt: Date.now(),
    };

    return res.json({
      success: true,

      requiresPasswordConfirmation: true,

      redirectUrl: "/profile/confirm-email-password",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const loadConfirmEmailPassword = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    if (!req.session.pendingEmailChange) {
      return res.redirect("/profile");
    }

    res.render("user/profile/confirm-email-password", {
      user,
    });
  } catch (error) {
    console.log("loadConfirmEmailPassword ERROR:", error);

    res.redirect("/profile");
  }
};

export const confirmEmailPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    const pending = req.session.pendingEmailChange;

    if (!pending) {
      return res.json({
        success: false,
        message: "Email change session expired",
      });
    }

    if (pending.userId.toString() !== req.session.user.id.toString()) {
      delete req.session.pendingEmailChange;

      return res.json({
        success: false,
        message: "Invalid request",
      });
    }

    if (!password || !confirmPassword) {
      return res.json({
        success: false,
        message: "Password is required",
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (user.googleId) {
      return res.json({
        success: false,
        message: "Google accounts cannot change email using a password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Incorrect password",
      });
    }

    const existingEmail = await User.findOne({
      email: pending.email,
      _id: {
        $ne: user._id,
      },
    });

    if (existingEmail) {
      delete req.session.pendingEmailChange;

      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    req.session.pendingProfileUpdate = {
      userId: user._id.toString(),

      firstName: pending.firstName,

      lastName: pending.lastName,

      email: pending.email,

      otp,

      otpExpiry: Date.now() + 300000,
    };

    delete req.session.pendingEmailChange;

    await sendOTP(pending.email, otp);

    console.log("EMAIL CHANGE OTP:", otp);

    return res.json({
      success: true,

      message: "OTP sent to your new email address",

      redirectUrl: "/profile/verifyemail",
    });
  } catch (error) {
    console.log("confirmEmailPassword ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Something went wrong",
    });
  }
};

export const verifyProfileOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const pending = req.session.pendingProfileUpdate;

    if (!pending) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    if (String(pending.otp) !== String(otp)) {
      return res.json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (pending.otpExpiry < Date.now()) {
      return res.json({
        success: false,
        message: "OTP expired",
      });
    }

    const user = await User.findById(pending.userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    user.firstName = pending.firstName;
    user.lastName = pending.lastName;
    user.email = pending.email;

    await user.save();

    req.session.user.firstName = pending.firstName;

    req.session.user.lastName = pending.lastName;

    req.session.user.email = pending.email;

    delete req.session.pendingProfileUpdate;

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const resendProfileOTP = async (req, res) => {
  try {
    const pending = req.session.pendingProfileUpdate;

    if (!pending) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    const newOTP = Math.floor(100000 + Math.random() * 900000);

    pending.otp = newOTP;

    pending.otpExpiry = Date.now() + 300000;

    req.session.pendingProfileUpdate = pending;

    await sendOTP(pending.email, newOTP);

    console.log("NEW PROFILE OTP:", newOTP);

    return res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};
export const loadChangePassword = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    res.render("user/profile/editpassword", {
      user,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Old password is incorrect",
      });
    }
    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.json({
        success: false,
        message: "New password cannot be same as old password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const loadAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    const addresses = await Address.find({
      userId: req.session.user.id,
    });

    res.render("user/profile/address", {
      user,
      addresses,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};
export const loadAddAddressPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    const returnTo = req.query.returnTo || "";

    res.render("user/profile/add-address", {
      user,
      returnTo,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/pageNotFound");
  }
};
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    const returnTo = req.body.returnTo;

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const { phone, streetAddress, city, state, pincode, country, isDefault } =
      req.body;
    if (!phone || !streetAddress || !city || !state || !pincode || !country) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      return res.json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const addressCount = await Address.countDocuments({
      userId: user._id,
    });

    const defaultValue = isDefault === "on";

    if (defaultValue) {
      await Address.updateMany(
        { userId: user._id },
        { $set: { isDefault: false } },
      );
    }
    const newAddress = new Address({
      userId: user._id,

      firstName: user.firstName,

      lastName: user.lastName,

      phoneNumber: phone,

      streetAddress,

      city,

      state,

      pincode,

      country,

      isDefault: defaultValue,
    });
    await newAddress.save();

    const redirectUrl =
      returnTo === "checkout" ? "/checkout" : "/profile/address";

    return res.json({
      success: true,
      message: "Address added successfully",
      redirectUrl,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const loadAddressPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    const addresses = await Address.find({
      userId: user._id,
    });

    res.render("user/profile/address", {
      user,
      addresses,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/pageNotFound");
  }
};
export const loadEditAddressPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.redirect("/profile/address");
    }

    const returnTo = req.query.returnTo || "";

    res.render("user/profile/edit-address", {
      user,
      address,
      returnTo,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile/address");
  }
};
export const updateAddress = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      streetAddress,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    const returnTo = req.body.returnTo;

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !streetAddress ||
      !city ||
      !state ||
      !pincode ||
      !country
    ) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.json({
        success: false,
        message: "Address not found",
      });
    }

    if (isDefault === "on") {
      await Address.updateMany(
        { userId: req.session.user.id },
        { $set: { isDefault: false } },
      );
    }

    address.firstName = firstName;
    address.lastName = lastName;
    address.phoneNumber = phoneNumber;
    address.streetAddress = streetAddress;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    address.country = country;
    address.isDefault = isDefault === "on";

    await address.save();

    const redirectUrl =
      returnTo === "checkout" ? "/checkout" : "/profile/address";

    return res.json({
      success: true,
      message: "Address updated successfully",
      redirectUrl,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.findByIdAndDelete(req.params.id);

    const defaultAddress = await Address.findOne({
      userId: req.session.user.id,
      isDefault: true,
    });

    if (!defaultAddress) {
      const firstAddress = await Address.findOne({
        userId: req.session.user.id,
      });

      if (firstAddress) {
        firstAddress.isDefault = true;

        await firstAddress.save();
      }
    }

    return res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const loadOrders = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const sort = req.query.sort || "newest";

    let sortOption = {};

    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;

      case "high":
        sortOption = { grandTotal: -1 };
        break;

      case "low":
        sortOption = { grandTotal: 1 };
        break;

      default:
        sortOption = { createdAt: -1 };
    }

    const orders = await Order.find({
      user: userId,
    })

      .populate({
        path: "items.product",
      })

      .populate({
        path: "items.variant",
      })

      .sort(sortOption);

    res.render("user/profile/orders", {
      user: req.session.user,
      orders,
      sort,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};

export const loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const order = await Order.findOne({
      _id: req.params.id,

      user: userId,
    })

      .populate("items.product")

      .populate("items.variant");

    if (!order) {
      req.session.message = {
        type: "error",

        text: "Order not found",
      };

      return res.redirect("/profile/orders");
    }

    const activeItems = order.items.filter(
      (item) =>
        item.itemStatus !== "Cancelled" && item.itemStatus !== "Returned",
    );

    const canDownloadInvoice =
      activeItems.length > 0 &&
      activeItems.every((item) =>
        ["Shipped", "Out For Delivery", "Delivered"].includes(item.itemStatus),
      );

    const hasCoupon = !!order.coupon;

    const canReturnWholeOrder =
      activeItems.length > 0 &&
      activeItems.every(
        (item) =>
          item.itemStatus === "Delivered" && item.returnStatus === "None",
      );

    const isRetryPaymentOrder =
      order.paymentMethod === "RAZORPAY" && order.paymentStatus === "Pending";

    console.log("=== ORDER SENT TO EJS ===");
    console.log(order._id.toString());

    console.log(JSON.stringify(order.items, null, 2));

    console.log("Before render:", order.items[0]._id.toString());

    console.log(
      order.items.map((i) => ({
        id: i._id.toString(),
        status: i.itemStatus,
      })),
    );

    res.render("user/profile/order-details", {
      user: req.session.user,

      order,

      hasCoupon: !!order.coupon,
      canDownloadInvoice,
      canReturnWholeOrder,
      isRetryPaymentOrder,
    });
  } catch (error) {
    console.log(error);
    console.error("loadOrderDetails ERROR:");
    console.error(error.stack);

    res.redirect("/profile/orders");
  }
};

export const cancelItem = async (req, res) => {
  try {
    const { orderId, variantId } = req.params;
    const { reason } = req.body;

    const roundMoney = (value) =>
      Math.round((Number(value) + Number.EPSILON) * 100) / 100;

    const order = await Order.findOne({
      _id: orderId,
      user: req.session.user.id,
    }).populate("items.variant");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.find(
      (i) => i.variant && i.variant._id.toString() === variantId,
    );

    if (!item) {
      return res.json({
        success: false,
        message: "Item not found",
      });
    }

    if (!["Pending", "Confirmed", "Processing"].includes(item.itemStatus)) {
      return res.json({
        success: false,
        message: "This item cannot be cancelled",
      });
    }

    const previousGrandTotal = roundMoney(order.grandTotal);
    const originalShippingCharge = roundMoney(order.shippingCharge);

    item.itemStatus = "Cancelled";
    item.cancelReason = reason || "";
    item.cancelledAt = new Date();

    const variant = await Variant.findById(item.variant);

    if (variant) {
      variant.stock += item.quantity;
      await variant.save();
    }

    const activeItems = order.items.filter(
      (i) => i.itemStatus !== "Cancelled" && i.itemStatus !== "Returned",
    );

    const allCancelled = activeItems.length === 0;

    let couponRemoved = false;

    if (order.coupon && !allCancelled) {
      const coupon = await Coupon.findById(order.coupon);

      if (coupon) {
        const remainingOriginalTotal = activeItems.reduce(
          (sum, i) => sum + Number(i.originalPrice || 0),
          0,
        );

        if (remainingOriginalTotal < Number(coupon.minimumPurchase || 0)) {
          order.coupon = null;
          couponRemoved = true;

          coupon.usedCount = Math.max(0, Number(coupon.usedCount || 0) - 1);

          coupon.usedBy = coupon.usedBy.filter(
            (u) => u.user.toString() !== order.user.toString(),
          );

          await coupon.save();

          activeItems.forEach((activeItem) => {
            activeItem.allocatedCouponDiscount = 0;
            activeItem.finalPricePaid = roundMoney(
              Number(activeItem.salePrice || 0) *
                Number(activeItem.quantity || 0),
            );
            activeItem.total = activeItem.finalPricePaid;
          });

          order.discount = 0;
        }
      }
    }

    if (allCancelled) {
      order.subtotal = 0;
      order.discount = 0;
      order.shippingCharge = 0;
      order.grandTotal = 0;
    } else {
      order.subtotal = roundMoney(
        activeItems.reduce(
          (sum, activeItem) =>
            sum +
            Number(activeItem.salePrice || 0) *
              Number(activeItem.quantity || 0),
          0,
        ),
      );

      if (order.coupon && !couponRemoved) {
        order.discount = roundMoney(
          activeItems.reduce(
            (sum, activeItem) =>
              sum + Number(activeItem.allocatedCouponDiscount || 0),
            0,
          ),
        );
      } else {
        order.discount = 0;
      }

      order.shippingCharge = order.subtotal > 999 ? 0 : 100;

      order.grandTotal = roundMoney(
        order.subtotal -
          order.discount +
          Number(order.shippingCharge || 0) +
          Number(order.tax || 0),
      );
    }

    const newGrandTotal = roundMoney(order.grandTotal);

    if (
      order.paymentMethod !== "COD" &&
      ["Paid", "Partially Refunded"].includes(order.paymentStatus)
    ) {
      const refundAmount = roundMoney(
        Math.max(0, previousGrandTotal - newGrandTotal),
      );

      if (refundAmount > 0) {
        let wallet = await Wallet.findOne({
          user: order.user,
        });

        if (!wallet) {
          wallet = await Wallet.create({
            user: order.user,
            balance: 0,
            transactions: [],
          });
        }

        wallet.balance = roundMoney(Number(wallet.balance || 0) + refundAmount);

        wallet.transactions.push({
          type: "credit",
          amount: refundAmount,
          reason: "Order Cancelled",
          order: order._id,
          description: allCancelled
            ? "Refund for whole order cancellation"
            : "Refund for cancelled item",
        });

        await wallet.save();
      }

      order.refundAmount = refundAmount;

      if (allCancelled) {
        order.paymentStatus = "Refunded";
      } else {
        order.paymentStatus = "Partially Refunded";
      }
    }

    if (allCancelled) {
      order.orderStatus = "Cancelled";
      order.cancelledAt = new Date();

      if (order.coupon) {
        const coupon = await Coupon.findById(order.coupon);

        if (coupon) {
          coupon.usedCount = Math.max(0, Number(coupon.usedCount || 0) - 1);

          coupon.usedBy = coupon.usedBy.filter(
            (u) => u.user.toString() !== order.user.toString(),
          );

          await coupon.save();
        }

        order.coupon = null;
      }

      order.discount = 0;
      order.subtotal = 0;
      order.shippingCharge = 0;
      order.grandTotal = 0;
    } else {
      order.orderStatus = "Partially Cancelled";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Item cancelled successfully",
    });
  } catch (error) {
    console.log("cancelItem ERROR:", error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const returnItem = async (req, res) => {
  try {
    const { orderId, variantId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.json({
        success: false,
        message: "Return reason is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.session.user.id,
    })
      .populate("items.product")
      .populate("items.variant");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.find(
      (item) => item.variant && item.variant._id.toString() === variantId,
    );

    if (!item) {
      return res.json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.itemStatus !== "Delivered") {
      return res.json({
        success: false,
        message: "Only delivered items can be returned",
      });
    }

    if (item.returnStatus === "Requested") {
      return res.json({
        success: false,
        message: "Return already requested",
      });
    }

    if (item.returnStatus === "Approved") {
      return res.json({
        success: false,
        message: "Item has already been returned",
      });
    }

    if (item.returnStatus === "Rejected") {
      item.returnStatus = "Requested";
    } else {
      item.returnStatus = "Requested";
    }

    item.returnedReason = reason.trim();
    item.returnRequestedAt = new Date();

    const requestedItems = order.items.filter(
      (item) => item.returnStatus === "Requested",
    );

    if (requestedItems.length > 0) {
      order.returnStatus = "Requested";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Return request submitted successfully",
    });
  } catch (error) {
    console.log("returnItem ERROR:", error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const buyAgain = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,

      user: req.session.user.id,
    });

    if (!order) {
      return res.json({
        success: false,

        message: "Order not found",
      });
    }

    let cart = await Cart.findOne({
      user: req.session.user.id,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.session.user.id,

        items: [],
      });
    }

    for (const item of order.items) {
      if (item.itemStatus === "Cancelled" || item.itemStatus === "Returned") {
        continue;
      }

      const existingItem = cart.items.find(
        (cartItem) => cartItem.variant.toString() === item.variant.toString(),
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.items.push({
          product: item.product,

          variant: item.variant,

          quantity: item.quantity,
        });
      }
    }

    await cart.save();

    return res.json({
      success: true,

      message: "Products added to cart",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: "Something went wrong",
    });
  }
};

export const cancelWholeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.session.user.id,
    }).populate("coupon");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["Pending", "Confirmed", "Processing"].includes(order.orderStatus)) {
      return res.json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    for (const item of order.items) {
      const variant = await Variant.findById(item.variant);

      if (variant) {
        variant.stock += item.quantity;
        await variant.save();
      }

      item.itemStatus = "Cancelled";
      item.cancelledAt = new Date();
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = new Date();

    if (order.paymentMethod !== "COD") {
      order.paymentStatus = "Refunded";

      let wallet = await Wallet.findOne({
        user: order.user,
      });

      if (!wallet) {
        wallet = await Wallet.create({
          user: order.user,
          balance: 0,
          transactions: [],
        });
      }
      const refundAmount =
        order.items.reduce((sum, item) => sum + item.finalPricePaid, 0) +
        order.shippingCharge;

      order.refundAmount = refundAmount;
      order.refundedAt = new Date();

      wallet.balance += refundAmount;

      wallet.transactions.push({
        type: "credit",
        amount: refundAmount,
        reason: "Order Cancelled",
        order: order._id,
        description: "Refund for whole order cancellation",
      });

      await wallet.save();
    }

    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon._id, {
        $inc: {
          usedCount: -1,
        },
        $pull: {
          usedBy: {
            user: order.user,
          },
        },
      });
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const returnWholeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.json({
        success: false,
        message: "Return reason is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.session.user.id,
    });

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "Returned") {
      return res.json({
        success: false,
        message: "Order already returned",
      });
    }

    const activeItems = order.items.filter(
      (item) =>
        item.itemStatus !== "Cancelled" && item.itemStatus !== "Returned",
    );

    if (activeItems.length === 0) {
      return res.json({
        success: false,
        message: "No items are available for return",
      });
    }

    const allActiveItemsDelivered = activeItems.every(
      (item) => item.itemStatus === "Delivered",
    );

    if (!allActiveItemsDelivered) {
      return res.json({
        success: false,
        message: "Only delivered items can be returned",
      });
    }

    const returnableItems = activeItems.filter(
      (item) => item.itemStatus === "Delivered" && item.returnStatus === "None",
    );

    if (returnableItems.length === 0) {
      return res.json({
        success: false,
        message: "No items are available for return",
      });
    }

    for (const item of returnableItems) {
      item.returnStatus = "Requested";

      item.returnedReason = reason.trim();

      item.returnRequestedAt = new Date();
    }

    order.returnedReason = reason.trim();

    order.returnStatus = "Requested";

    await order.save();

    return res.json({
      success: true,

      message: "Return request submitted successfully",
    });
  } catch (error) {
    console.log("returnWholeOrder ERROR:", error);

    return res.json({
      success: false,

      message: "Something went wrong",
    });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const roundMoney = (value) =>
      Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user.id,
    })
      .populate("items.product")
      .populate("items.variant");

    if (!order) {
      return res.redirect("/profile/orders");
    }

    const invoiceItems = order.items
      .filter(
        (item) =>
          item.itemStatus !== "Cancelled" && item.itemStatus !== "Returned",
      )
      .map((item) => ({
        ...item.toObject(),
        total: roundMoney(item.total),
      }));

    const subtotal = roundMoney(
      invoiceItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    );

    const grandTotal = roundMoney(
      subtotal -
        Number(order.discount || 0) +
        Number(order.shippingCharge || 0) +
        Number(order.tax || 0),
    );

    res.render("user/profile/order-document", {
      user: req.session.user,

      order,

      documentType: "invoice",

      items: invoiceItems,

      subtotal,

      grandTotal,
    });
  } catch (err) {
    console.log("downloadInvoice ERROR:", err);
  }
};

export const searchOrders = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const orders = await Order.find({
      user: req.session.user.id,

      orderId: {
        $regex: keyword,

        $options: "i",
      },
    })

      .populate("items.product")

      .populate("items.variant")

      .sort({
        createdAt: -1,
      });

    res.render("user/profile/orders", {
      user: req.session.user,

      orders,

      sort: "newest",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile/orders");
  }
};

export const downloadOrderSummary = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,

      user: req.session.user.id,
    })

      .populate("items.product")

      .populate("items.variant");

    if (!order) {
      return res.redirect("/profile/orders");
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.total,

      0,
    );

    res.render("user/profile/order-document", {
      user: req.session.user,

      order,

      documentType: "summary",

      items: order.items,

      subtotal,

      grandTotal: order.grandTotal,
    });
  } catch (err) {
    console.log(err);
  }
};

export const loadWallet = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const limit = 10;

    const wallet = await Wallet.findOne({
      user: req.session.user.id,
    });

    if (!wallet) {
      return res.render("user/profile/wallet", {
        user: req.session.user,

        wallet: {
          balance: 0,

          transactions: [],
        },

        currentPage: 1,

        totalPages: 1,
      });
    }

    wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);

    const totalTransactions = wallet.transactions.length;

    const totalPages = Math.ceil(totalTransactions / limit);

    const transactions = wallet.transactions.slice(
      (page - 1) * limit,

      page * limit,
    );

    res.render("user/profile/wallet", {
      user: req.session.user,

      wallet: {
        balance: wallet.balance,

        transactions,
      },

      currentPage: page,

      totalPages,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};

export const loadReferralPage = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findById(userId);

    const wallet = await Wallet.findOne({
      user: userId,
    });
    const referralLink = `${req.protocol}://${req.get("host")}/signup?ref=${user.referralCode}`;

    const referrals = await Referral.find({
      referrer: userId,
    }).populate("referredUser", "firstName lastName email createdAt");

    const message = req.session.message;
    delete req.session.message;

    res.render("user/profile/refferal", {
      user,
      wallet,
      referrals,
      referralCount: referrals.length,
      totalRewards: referrals.length * 50,
      message,
      referralLink,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};
export const applyReferralCode = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { referralCode } = req.body;

    const user = await User.findById(userId);

    if (user.isReferralApplied) {
      return res.json({
        success: false,

        message: "Referral already applied.",
      });
    }

    if (user.referralCode === referralCode) {
      return res.json({
        success: false,

        message: "You cannot use your own referral code.",
      });
    }

    const referrer = await User.findOne({
      referralCode,
    });

    if (!referrer) {
      return res.json({
        success: false,

        message: "Invalid referral code.",
      });
    }

    const alreadyExists = await Referral.findOne({
      referredUser: userId,
    });

    if (alreadyExists) {
      return res.json({
        success: false,

        message: "Referral already used.",
      });
    }

    let referrerWallet = await Wallet.findOne({
      user: referrer._id,
    });

    if (!referrerWallet) {
      referrerWallet = new Wallet({
        user: referrer._id,
      });
    }

    let userWallet = await Wallet.findOne({
      user: userId,
    });

    if (!userWallet) {
      userWallet = new Wallet({
        user: userId,
      });
    }

    referrerWallet.balance += 50;

    referrerWallet.transactions.push({
      type: "credit",

      amount: 50,

      reason: "Referral Bonus",

      description: `Referral bonus for inviting ${user.firstName}`,
    });

    userWallet.balance += 50;

    userWallet.transactions.push({
      type: "credit",

      amount: 50,

      reason: "Referral Bonus",

      description: `Referral signup reward`,
    });

    await referrerWallet.save();

    await userWallet.save();

    user.referredBy = referrer._id;

    user.isReferralApplied = true;

    await user.save();

    await Referral.create({
      referrer: referrer._id,

      referredUser: userId,

      referralCode,

      rewardAmount: 50,
    });

    return res.json({
      success: true,

      message: "Referral applied successfully. ₹50 added to your wallet.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: "Something went wrong.",
    });
  }
};
export const loadCoupons = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const coupons = await profileService.getAvailableCoupons(userId);

    res.render("user/profile/coupons", {
      coupons,
      active: "coupons",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/profile");
  }
};
