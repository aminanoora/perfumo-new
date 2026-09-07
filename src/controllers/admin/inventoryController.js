import Variant from "../../models/Variant.js";
import Product from "../../models/Product.js";
import fs from "fs";
import path from "path";


export const loadInventory = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || "";
    let query = {};

    if (search) {
      const products = await Product.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const productIds = products.map((p) => p._id);

      const orConditions = [
        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },

        {
          concentration: {
            $regex: search,
            $options: "i",
          },
        },

        {
          product: {
            $in: productIds,
          },
        },
      ];

      if (!isNaN(search)) {
        orConditions.push({
          size: Number(search),
        });
      }

      query.$or = orConditions;
    }

    if (status === "instock") {
      query.stock = { $gt: 10 };
    } else if (status === "lowstock") {
      query.stock = { $gt: 0, $lte: 10 };
    } else if (status === "outofstock") {
      query.stock = 0;
    }

    const variants = await Variant.find(query)
      .populate({
        path: "product",
        select: "name brand category",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalVariants = await Variant.countDocuments(query);

    const totalPages = Math.ceil(totalVariants / limit);

    const inStock = await Variant.countDocuments({ stock: { $gt: 0 } });

    const lowStock = await Variant.countDocuments({
      stock: { $gt: 0, $lte: 10 },
    });

    const outOfStock = await Variant.countDocuments({
      stock: 0,
    });

    res.render("admin/inventory/inventory", {
      variants,
      search,
      status,
      currentPage: page,
      totalPages,
      totalVariants,
      active: "inventory",
      stats: {
        totalVariants,
        inStock,
        lowStock,
        outOfStock,
      },
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
};

export const loadEditVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    const variant = await Variant.findById(variantId);

    if (!variant || variant.isDeleted) {
      req.session.adminMessage = {
        type: "error",
        text: "Variant not found.",
      };

      return res.redirect("/admin/product");
    }

    const product = await Product.findById(variant.product)
      .populate("brand")
      .populate("category");

    const message = req.session.adminMessage || null;
    req.session.adminMessage = null;

    res.render("admin/product/edit-variant", {
      product,

      variant,

      active: "product",

      message,
    });
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",

      text: "Unable to load variant.",

      readOnly: true,
    };

    res.redirect("/admin/product");
  }
};

export const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    const {
      sku,

      size,

      concentration,

      stock,

      price,

      salePrice,

      weight,

      existingImages,
    } = req.body;

    const variant = await Variant.findById(variantId);

    if (!variant || variant.isDeleted) {
      req.session.adminMessage = {
        type: "error",

        text: "Variant not found.",
      };

      return res.redirect("/admin/product");
    }

    const skuExists = await Variant.findOne({
      sku: sku.toUpperCase(),

      _id: { $ne: variantId },
    });

    if (skuExists) {
      req.session.adminMessage = {
        type: "error",

        text: "SKU already exists.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    let images = [];

    if (existingImages) {
      images = Array.isArray(existingImages)
        ? existingImages
        : [existingImages];
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push(file.filename);
      });
    }
    const removedImages = variant.images.filter((img) => !images.includes(img));

    removedImages.forEach((img) => {
      const filePath = path.join("public", "uploads", "products", img);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    if (images.length < 3 || images.length > 5) {
      req.session.adminMessage = {
        type: "error",

        text: "Variant must have between 3 and 5 images.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    variant.sku = sku.toUpperCase();

    variant.size = Number(size);

    variant.concentration = concentration;

    variant.stock = Number(stock);

    variant.price = Number(price);

    variant.salePrice = Number(salePrice) || 0;

    variant.weight = Number(weight);

    variant.images = images;

    await variant.save();

    req.session.adminMessage = {
      type: "success",

      text: "Variant updated successfully.",
    };

    res.redirect(`/admin/inventory/${variant._id}`);
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",

      text: "Unable to update variant.",

      readOnly: false,
    };

    res.redirect("/admin/inventory");
  }
};
