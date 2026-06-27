import express from "express";

import {
    getCategoriesPage,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    updateCategory,
    categoryDetails,
    listCategory,
    unlistCategory,
    deleteCategory
} from "../../controllers/admin/categoryController.js";

import adminAuth from "../../middleware/adminAuth.js";
import noCache from "../../middleware/noCache.js";
import uploadCategory from "../../middleware/uploadCategory.js";

const router = express.Router();

router.get(
    "/categories",
    adminAuth,
    noCache,
    getCategoriesPage
);

router.get(
    "/categories/add",
    adminAuth,
    noCache,
    loadAddCategory
);

router.post(
    "/categories/add",
    adminAuth,
    uploadCategory.single("image"),
    addCategory
);

router.get(
    "/categories/edit/:id",
    adminAuth,
    noCache,
    loadEditCategory
);

router.post(
    "/categories/edit/:id",
    adminAuth,
    updateCategory
);

router.get(
    "/categories/:id",
    adminAuth,
    noCache,
    categoryDetails
);

router.get(
    "/categories/list/:id",
    adminAuth,
    listCategory
);

router.get(
    "/categories/unlist/:id",
    adminAuth,
    unlistCategory
);

router.post(
    "/categories/delete/:id",
    adminAuth,
    deleteCategory
);

export default router;