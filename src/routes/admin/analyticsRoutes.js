import express from "express";

const router = express.Router();

import adminAuth from "../../middleware/adminAuth.js";
import noCache from "../../middleware/noCache.js";

import {
  loadAnalytics,
  fetchAnalytics,
  exportPdf,
  exportExcel,
} from "../../controllers/admin/analyticsController.js";

router.get(
  "/",

  adminAuth,

  noCache,

  loadAnalytics,
);

router.get(
  "/data",

  adminAuth,

  noCache,

  fetchAnalytics,
);

router.get(
  "/export/pdf",

  adminAuth,

  exportPdf,
);

router.get(
  "/export/excel",

  adminAuth,

  exportExcel,
);

export default router;
