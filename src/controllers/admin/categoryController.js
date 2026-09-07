import Category from "../../models/Category.js";

import Product from "../../models/Product.js";

import * as categoryService from "../../services/admin/categoryService.js";

export const getCategoriesPage = async (req, res) => {
  try {
   const { categories, totalPages, page, search, sort } = await categoryService.getCategoriesService({
      page: req.query.page,
      search: req.query.search,
      sort: req.query.sort,
    });

    const message = req.session.message;

    req.session.message = null;

    res.render("admin/categories/categories", {
      categories,
      page,
      totalPages,
      search,
      sort,
      active: "category",
      message,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
};

export const loadAddCategory = async (req, res) => {
  try {
    const parentCategories = await Category.find({
      parentCategory: null,
      isDeleted: false,
    });

    const message = req.session.message;

    req.session.message = null;

    res.render("admin/categories/add-category", {
      parentCategories,
      active: "category",
      message,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/categories");
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, slug, parentCategory, description } = req.body;

    const image = req.file
      ? "/admin/uploads/categories/" + req.file.filename
      : "";

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      req.session.message = {
        type: "error",
        text: "Category already exists!",
      };

      return res.redirect("/admin/categories/add");
    }

    const category = new Category({
      name,
      slug,
      parentCategory: parentCategory || null,
      description,
      image,
    });

    await category.save();

    req.session.message = {
      type: "success",
      text: "Category added successfully!",
    };

    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Something went wrong!",
    };

    res.redirect("/admin/categories/add");
  }
};

export const loadEditCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    const parentCategories = await Category.find({
      isDeleted: false,
      _id: { $ne: req.params.id },
    });

    const message = req.session.message;
    req.session.message = null;

    res.render("admin/categories/edit-category", {
      category,
      parentCategories,
      active: "category",
      message,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/categories");
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, slug, parentCategory, description } = req.body;

    const categoryId = req.params.id;

    const removeImage = req.body.removeImage;

    const category = await Category.findById(categoryId);

    if (!category) {
      req.session.message = {
        type: "error",
        text: "Category not found.",
      };

      return res.redirect("/admin/categories");
    }

    const existingName = await Category.findOne({
      name: name,
      _id: { $ne: categoryId },
      isDeleted: false,
    });

    if (existingName) {
      req.session.message = {
        type: "warning",
        text: "Category name already exists.",
      };

      return res.redirect(`/admin/categories/edit/${categoryId}`);
    }

    const existingSlug = await Category.findOne({
      slug: slug,
      _id: { $ne: categoryId },
      isDeleted: false,
    });

    if (existingSlug) {
      req.session.message = {
        type: "warning",
        text: "Slug already exists.",
      };

      return res.redirect(`/admin/categories/edit/${categoryId}`);
    }

    let image = category.image;

    if (removeImage === "true") {
      image = "";
    }

    if (req.file) {
      image = "/admin/uploads/categories/" + req.file.filename;
    }

    await Category.findByIdAndUpdate(categoryId, {
      name: name,
      slug: slug,
      parentCategory: parentCategory || null,
      description,
      image,
    });

   

    req.session.message = {
      type: "success",
      text: "Category updated successfully.",
    };

    return res.redirect(`/admin/categories/edit/${categoryId}`);
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to update category.",
    };

    return res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
};

export const categoryDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    const category = await Category.findById(req.params.id).populate(
      "parentCategory",
    );

    if (!category || category.isDeleted) {
      req.session.message = {
        type: "error",
        text: "Category not found.",
      };

      return res.redirect("/admin/categories");
    }

    const query = {
      category: category._id,
    };

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrands = (
      await Product.distinct("brand", {
        category: category._id,
      })
    ).length;

    const message = req.session.message;
    req.session.message = null;

    res.render("admin/categories/category-details", {
      category,
      products,
      totalProducts,
      totalBrands,
      page,
      totalPages: Math.ceil(totalProducts / limit),
      search,
      message,
      active: "category",
    });
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to load category.",
    };

    res.redirect("/admin/categories");
  }
};

export const listCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      req.session.message = {
        type: "error",
        text: "Category not found.",
      };

      return res.redirect("/admin/categories");
    }

    category.isListed = true;

    await category.save();

    req.session.message = {
      type: "success",
      text: "Category listed successfully.",
    };

    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to list category.",
    };

    res.redirect("/admin/categories");
  }
};

export const unlistCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      req.session.message = {
        type: "error",
        text: "Category not found.",
      };

      return res.redirect("/admin/categories");
    }

    category.isListed = false;

    await category.save();

    req.session.message = {
      type: "success",
      text: "Category hidden successfully.",
    };

    res.redirect("/admin/categories");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to hide category.",
    };

    res.redirect("/admin/categories");
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const productExists = await Product.exists({
      category: categoryId,
    });

    if (productExists) {
      return res.json({
        success: false,
        message: "Cannot delete category because products exist under it.",
      });
   
    }

    await Category.findByIdAndUpdate(categoryId, {
      isDeleted: true,
      isListed: false,
    });

    return res.json({
      success: true,
      message: "Category deleted successfully.",
    });

  
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong.",
    });
   
  }
};
