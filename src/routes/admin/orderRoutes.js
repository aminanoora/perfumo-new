import express from "express";

import adminAuth from "../../middleware/adminAuth.js";

import {
    loadOrders,
    loadOrderDetails,
     getOrderDetails,
    updateOrderStatus
} from "../../controllers/admin/orderController.js";

const router = express.Router();

router.get(
    "/orders",
    adminAuth,
    loadOrders
);

router.get(
    "/orders/:id",
    adminAuth,
    loadOrderDetails
);

router.get(
    "/orders/:orderId",
    getOrderDetails
);

router.post(
    "/orders/:orderId/status",
    updateOrderStatus
);

export default router;