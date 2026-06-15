import express from "express";
import {

  getUserDetails,
  updateUser,
  deleteUser,
  addUser
} from "../../controllers/admin/userController.js";
import upload from "../../middleware/upload.js";
import noCache from "../../middleware/noCache.js";
import adminAuth from "../../middleware/adminAuth.js";
const router = express.Router();

router.get("/users/user-details/:id",adminAuth,
    noCache, getUserDetails);
router.post("/users/user-details/:id", adminAuth,
    noCache,updateUser);
router.post("/users/user-details/:id/delete",adminAuth,
    noCache, deleteUser);

router.get("/users/add",adminAuth,noCache, (req, res) => {
  res.render("admin/users/add-user");
});

router.post("/users/add",adminAuth,
    noCache, upload.single("profileImage"),addUser);
export default router;