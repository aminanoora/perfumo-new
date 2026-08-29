import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Wallet from "../../models/Wallet.js";
import Variant from "../../models/Variant.js";

const statusFlow = {
  Pending: ["Confirmed", "Cancelled"],

  Confirmed: ["Processing", "Cancelled"],

  Processing: ["Shipped", "Cancelled"],

  Shipped: ["Out For Delivery"],

  "Out For Delivery": ["Delivered"],

  Delivered: [],

  Cancelled: [],

  Returned: [],

  "Partially Cancelled": [],

  "Partially Returned": [],
};

export const loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 10;

    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const status = req.query.status || "";

    const returnStatus = req.query.returnStatus || "";

    const sort = req.query.sort || "newest";

    const dateRange = req.query.dateRange || "";

    let query = {};

    const payment = req.query.payment || "";

    if (status) {
      query.orderStatus = status;
    }

    if (payment) {
      query.paymentStatus = payment;
    }

    const today = new Date();

    if (dateRange === "today") {
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    if (dateRange === "week") {
      const start = new Date();
      start.setDate(today.getDate() - 7);

      query.createdAt = { $gte: start };
    }

    if (dateRange === "month") {
      const start = new Date();
      start.setMonth(today.getMonth() - 1);

      query.createdAt = { $gte: start };
    }

    if (dateRange === "year") {
      const start = new Date();
      start.setFullYear(today.getFullYear() - 1);

      query.createdAt = { $gte: start };
    }

    let orders = await Order.find(query)

      .populate({
        path: "user",
        select: "firstName lastName email phone",
      })

      .sort({
        createdAt: sort === "oldest" ? 1 : -1,
      });

    if (search.trim() !== "") {
      const keyword = search.toLowerCase();

      orders = orders.filter((order) => {
        const customer = order.user;

        const fullName =
          `${customer?.firstName || ""} ${customer?.lastName || ""}`.toLowerCase();

        return (
          order.orderId.toLowerCase().includes(keyword) ||
          fullName.includes(keyword) ||
          customer?.email?.toLowerCase().includes(keyword) ||
          customer?.phone?.includes(keyword)
        );
      });
    }
    if (returnStatus) {
      orders = orders.filter((order) =>
        order.items.some((item) => item.returnStatus === returnStatus),
      );
    }

    const totalOrders = orders.length;

    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = orders.slice(skip, skip + limit);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const stats = {
      total: await Order.countDocuments(),

      today: await Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }),

      pending: await Order.countDocuments({
        orderStatus: {
          $in: ["Pending", "Confirmed", "Processing"],
        },
      }),

      shipped: await Order.countDocuments({
        orderStatus: {
          $in: ["Shipped", "Out For Delivery"],
        },
      }),

      delivered: await Order.countDocuments({
        orderStatus: "Delivered",
      }),

      returnsCancelled: await Order.countDocuments({
        orderStatus: {
          $in: [
            "Cancelled",
            "Returned",
            "Partially Cancelled",
            "Partially Returned",
          ],
        },
      }),
    };

    const message = req.session.message || null;
    delete req.session.message;

    res.render("admin/orders/orders", {
      orders: paginatedOrders,

      currentPage: page,

      totalPages,

      totalOrders,

      search,

      returnStatus,

      message,

      status,

      sort,

      dateRange,

      limit,

      stats,

      payment,

      active: "orders",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/dashboard");
  }
};

const updateOrderStatusFromItems = (order) => {
  const total = order.items.length;

  const cancelled = order.items.filter(
    (i) => i.itemStatus === "Cancelled",
  ).length;

  const returned = order.items.filter(
    (i) => i.itemStatus === "Returned",
  ).length;

  if (cancelled === total) {
    order.orderStatus = "Cancelled";
  } else if (returned === total) {
    order.orderStatus = "Returned";
  } else if (cancelled > 0) {
    order.orderStatus = "Partially Cancelled";
  } else if (returned > 0) {
    order.orderStatus = "Partially Returned";
  }
};

export const loadOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)

      .populate({
        path: "user",
        select: "firstName lastName email phone createdAt",
      })

      .populate({
        path: "items.product",
      })

      .populate({
        path: "items.variant",
      });

    if (!order) {
      return res.redirect("/admin/orders");
    }
    let currentStatus = order.orderStatus;

    if (
      currentStatus === "Partially Returned" ||
      currentStatus === "Partially Cancelled"
    ) {
      const activeItem = order.items.find(
        (item) =>
          item.itemStatus !== "Returned" && item.itemStatus !== "Cancelled",
      );

      if (activeItem) {
        currentStatus = activeItem.itemStatus;
      }
    }

    const message = req.session.message || null;

    delete req.session.message;

    res.render("admin/orders/order-details", {
      order,
      currentStatus,
      message,
      active: "orders",
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/orders");
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user")
      .populate({
        path: "items.product",
        populate: {
          path: "brand category",
        },
      })
      .populate("items.variant")
      .populate("coupon");
    if (!order) {
      req.session.message = {
        type: "error",
        text: "Order not found",
      };

      return res.redirect("/admin/orders");
    }

    const message = req.session.message || null;
    delete req.session.message;

    res.render("admin/order-details", {
      order,
      currentPage: "orders",
      message,
      active: "orders",
    });
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };

    res.redirect("/admin/orders");
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      req.session.message = {
        type: "error",
        text: "Order not found",
      };

      return res.redirect("/admin/orders");
    }
    let currentStatus = order.orderStatus;

    if (
      currentStatus === "Partially Returned" ||
      currentStatus === "Partially Cancelled"
    ) {
      const activeItem = order.items.find(
        (item) =>
          item.itemStatus !== "Returned" && item.itemStatus !== "Cancelled",
      );

      if (activeItem) {
        currentStatus = activeItem.itemStatus;
      }
    }

    const allowedStatuses = statusFlow[currentStatus] || [];

    if (!allowedStatuses.includes(orderStatus)) {
      req.session.message = {
        type: "error",
        text: "Invalid status transition.",
      };

      return res.redirect(`/admin/orders/${order._id}`);
    }

    order.orderStatus = orderStatus;

    order.items.forEach((item) => {
      if (item.itemStatus !== "Cancelled" && item.itemStatus !== "Returned") {
        item.itemStatus = orderStatus;
      }
    });

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();

      order.items.forEach((item) => {
        if (item.itemStatus === "Delivered") {
          item.deliveredAt = new Date();

          order.paymentStatus = "Paid";
        }
      });
    }

    if (orderStatus === "Cancelled") {
      order.cancelledAt = new Date();

      order.items.forEach((item) => {
        if (item.itemStatus === "Cancelled") {
          item.cancelledAt = new Date();
        }
      });
    }

    if (orderStatus === "Returned") {
      order.returnedAt = new Date();

      order.items.forEach((item) => {
        if (item.itemStatus === "Returned") {
          item.returnedAt = new Date();
        }
      });
    }

    updateOrderStatusFromItems(order);

    await order.save();

    console.log("Saved order status:", order.orderStatus);

    if (orderStatus === "Cancelled") {
      req.session.message = {
        type: "success",
        text: "Order cancelled successfully.",
      };
    } else {
      req.session.message = {
        type: "success",
        text: "Order status updated successfully.",
      };
    }
    res.redirect(`/admin/orders/${order._id}`);
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Something went wrong.",
    };

    res.redirect("/admin/orders");
  }
};

export const approveReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findById(orderId)
      .populate("coupon")
      .populate("items.product")
      .populate("items.variant");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.returnStatus !== "Requested") {
      return res.json({
        success: false,
        message: "No return request found.",
      });
    }

    if (item.itemStatus !== "Delivered") {
      return res.json({
        success: false,
        message: "Only delivered items can be returned.",
      });
    }

    const roundMoney = (value) =>
      Math.round((Number(value) + Number.EPSILON) * 100) / 100;

    const originalGrandTotal = roundMoney(order.grandTotal || 0);

    item.returnStatus = "Approved";
    item.itemStatus = "Returned";
    item.returnedAt = new Date();

    const variantId = item.variant?._id || item.variant;

    const variant = await Variant.findById(variantId);

    if (variant) {
      variant.stock += Number(item.quantity || 0);

      await variant.save();
    }

    const remainingItems = order.items.filter(
      (i) =>
        i._id.toString() !== item._id.toString() &&
        i.itemStatus !== "Cancelled" &&
        i.itemStatus !== "Returned",
    );

    const cancelledItems = order.items.filter(
      (i) => i.itemStatus === "Cancelled",
    );

    const returnedItems = order.items.filter(
      (i) => i.itemStatus === "Returned",
    );

    const activeItems = order.items.filter(
      (i) => i.itemStatus !== "Cancelled" && i.itemStatus !== "Returned",
    );

    const allReturned = activeItems.length === 0 && returnedItems.length > 0;

    let refundAmount;

    if (allReturned) {
      refundAmount = originalGrandTotal;
    } else {
      refundAmount = roundMoney(Number(item.finalPricePaid || 0));
    }

    if (order.paymentMethod !== "COD") {
      if (order.coupon) {
        const remainingOriginalTotal = remainingItems.reduce(
          (sum, i) => sum + Number(i.originalPrice || 0),
          0,
        );

        const minimumPurchase = Number(order.coupon.minimumPurchase || 0);

        if (remainingOriginalTotal < minimumPurchase) {
          order.discount = 0;
          order.coupon = null;
        }
      }

      const RETURN_FEE = 100;

      let returnFee = 0;

      if (Number(order.returnFeeCharged || 0) === 0) {
        returnFee = RETURN_FEE;

        order.returnFeeCharged = RETURN_FEE;
      }

      refundAmount = roundMoney(Math.max(0, refundAmount - returnFee));

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

        reason: "Return Refund",

        order: order._id,

        description: allReturned
          ? "Refund for whole order return"
          : `Refund for ${item.product.name}`,
      });

      await wallet.save();

      order.refundAmount = roundMoney(
        Number(order.refundAmount || 0) + refundAmount,
      );

      order.refundedAt = new Date();

      order.paymentStatus = allReturned ? "Refunded" : "Partially Refunded";
    }

    order.subtotal = roundMoney(
      activeItems.reduce((sum, i) => sum + Number(i.finalPricePaid || 0), 0),
    );

    if (order.coupon) {
      order.discount = roundMoney(
        activeItems.reduce(
          (sum, i) => sum + Number(i.allocatedCouponDiscount || 0),
          0,
        ),
      );
    } else {
      order.discount = 0;
    }

    if (allReturned) {
      order.shippingCharge = 0;

      order.grandTotal = 0;

      order.orderStatus = "Returned";

      if (order.paymentMethod !== "COD") {
        order.paymentStatus = "Refunded";
      }
    } else {
      order.shippingCharge = order.subtotal >= 999 ? 0 : 100;

      order.grandTotal = roundMoney(
        order.subtotal -
          order.discount +
          order.shippingCharge +
          Number(order.tax || 0),
      );

      const returnedCount = order.items.filter(
        (i) => i.itemStatus === "Returned",
      ).length;

      if (returnedCount > 0) {
        order.orderStatus = "Partially Returned";

        if (order.paymentMethod !== "COD") {
          order.paymentStatus = "Partially Refunded";
        }
      }
    }

    const pendingItems = order.items.filter(
      (i) => i.returnStatus === "Requested",
    );

    if (pendingItems.length === 0) {
      order.returnStatus = "Approved";

      order.returnedAt = new Date();
    } else {
      order.returnStatus = "Requested";
    }

    await order.save();

    return res.json({
      success: true,
      message: "Return approved successfully.",
    });
  } catch (error) {
    console.log("approveReturn ERROR:", error);

    return res.json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

export const rejectReturn = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.json({
        success: false,

        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.json({
        success: false,

        message: "Item not found",
      });
    }

    if (item.returnStatus !== "Requested") {
      return res.json({
        success: false,

        message: "No pending return request.",
      });
    }

    item.returnStatus = "Rejected";

    item.returnRejectedReason = reason || "";

    await order.save();

    return res.json({
      success: true,

      message: "Return request rejected.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: "Something went wrong.",
    });
  }
};
