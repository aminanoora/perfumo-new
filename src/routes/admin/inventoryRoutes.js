import express from "express";

import adminAuth from "../../middleware/adminAuth.js";

import {
  loadInventory,
  loadEditVariant,
  updateVariant,
} from "../../controllers/admin/inventoryController.js";

const router = express.Router();

router.get("/inventory", adminAuth, loadInventory);

router.get("/inventory/:variantId", adminAuth, loadEditVariant);

router.get("/inventory/:variantId/edit", adminAuth, updateVariant);

export default router;
