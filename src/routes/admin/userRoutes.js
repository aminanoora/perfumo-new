import express from "express";
import { getUsersPage } from "../../controllers/admin/userController.js";
import noCache from "../../middleware/noCache.js";
import adminAuth from "../../middleware/adminAuth.js";
const router = express.Router();


router.get("/users", adminAuth,
    noCache, getUsersPage);

export default router;