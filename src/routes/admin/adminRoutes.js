import express from "express";

const router = express.Router();

import {
  loadAdminLogin,
  adminLogin,
  adminDashboard,
  getDashboardData,
  adminLogout,
} from "../../controllers/admin/adminController.js";

import adminAuth from "../../middleware/adminAuth.js";
import noCache from "../../middleware/noCache.js";

router.get("/login", noCache, loadAdminLogin);

router.post("/login", adminLogin);

router.get("/dashboard", adminAuth, noCache, adminDashboard);

router.get("/dashboard/data", adminAuth, noCache, getDashboardData);

router.get("/logout", noCache, adminLogout);

export default router;
