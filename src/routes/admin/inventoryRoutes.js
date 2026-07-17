import express from "express";

import adminAuth from "../../middleware/adminAuth.js";

import {
    loadInventory,
    loadEditVariant,
    updateVariant
} from "../../controllers/admin/inventoryController.js";

const router = express.Router();

router.get(
    "/inventory",
    adminAuth,
    loadInventory
);

router.get("/inventory/:variantId",loadEditVariant);

router.get("/inventory/:variantId/edit", updateVariant);

export default router;