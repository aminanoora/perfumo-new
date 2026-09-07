import Brand from "../../models/Brand.js";
import Product from "../../models/Product.js";
import { uploadProductImage } from "../../services/admin/cloudinaryService.js";
import Category from "../../models/Category.js";
import Variant from "../../models/Variant.js";
import fs from "fs";
import path from "path";

export const getProductsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const sort = req.query.sort || "desc";
    const status = req.query.status || "";

    const query = {
      isDeleted: false,
    };

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (status === "listed") {
      query.isListed = true;
    }

    if (status === "unlisted") {
      query.isListed = false;
    }

    const sortOption = {
      createdAt: sort === "asc" ? 1 : -1,
    };

    const pipeline = [
      { $match: query },

      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },

      { $unwind: "$brand" },

      {
        $lookup: {
          from: "variants",
          localField: "_id",
          foreignField: "product",
          as: "variants",
        },
      },

      {
        $addFields: {
          variantCount: {
            $size: "$variants",
          },

          totalStock: {
            $sum: "$variants.stock",
          },

          startingPrice: {
            $min: "$variants.price",
          },
        },
      },
    ];

    if (status === "outofstock") {
      pipeline.push({
        $match: {
          totalStock: 0,
        },
      });
    }
    const dataPipeline = [...pipeline];

    dataPipeline.push(
      { $sort: sortOption },
      { $skip: skip },
      { $limit: limit },
    );

    const products = await Product.aggregate(dataPipeline);

    const countPipeline = [...pipeline];

    countPipeline.push({
      $count: "total",
    });

    const countResult = await Product.aggregate(countPipeline);

    const totalProducts = countResult.length ? countResult[0].total : 0;

    const message = req.session.adminMessage || null;
    req.session.adminMessage = null;

    res.render("admin/product/products", {
      products,
      page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      search,
      sort,
      status,
      active: "product",
      message,
    });
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to load products.",
    };

    res.redirect("/admin/dashboard");
  }
};

export const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({
      isDeleted: false,
      isListed: true,
    });

    const brands = await Brand.find({
      isDeleted: false,
      isListed: true,
    });
    const featuredTypes = [
      { value: "bestseller", label: "Best Seller" },
      { value: "newarrival", label: "New Arrival" },
      { value: "trending", label: "Trending" },
      { value: "hidden", label: "Hidden Gem" },
      { value: "limited", label: "Limited Edition" },
      { value: "budget", label: "Budget Pick" },
    ];
    const message = req.session.adminMessage || null;
    req.session.adminMessage = null;

    res.render("admin/product/add-product", {
      categories,
      brands,
      active: "product",
      message,
      featuredTypes,
    });
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to load add product page.",
    };

    res.redirect("/admin/product");
  }
};

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      description,
      topNotes,
      heartNotes,
      baseNotes,
      occasion,
      featuredType,
    } = req.body;

    if (
      !name ||
      !category ||
      !brand ||
      !description ||
      !topNotes ||
      !heartNotes ||
      !baseNotes ||
      !occasion
    ) {
      req.session.adminMessage = {
        type: "error",
        text: "Please fill all required fields.",
      };

      return res.redirect("/admin/product/add-product");
    }

    const existingProduct = await Product.findOne({
      name: {
        $regex: new RegExp(`^${name.trim()}$`, "i"),
      },
      isDeleted: false,
    });

    if (existingProduct) {
      req.session.adminMessage = {
        type: "error",
        text: "Product already exists.",
      };

      return res.redirect("/admin/product/add-product");
    }

    const product = await Product.create({
      name: name.trim(),

      category,

      brand,

      description: description.trim(),

      topNotes: topNotes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      heartNotes: heartNotes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      baseNotes: baseNotes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      occasion: Array.isArray(occasion) ? occasion : [occasion],
      featuredType,
    });

    console.log("Created:", product);
    req.session.adminMessage = {
      type: "success",
      text: "Product added successfully.",
    };

    res.redirect(`/admin/product/${product._id}/add-variant`);
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Something went wrong while adding the product.",
    };

    res.redirect("/admin/product/add-product");
  }
};

export const loadAddVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(productId);

    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      req.session.adminMessage = {
        type: "error",
        text: "Product not found.",
      };

      return res.redirect("/admin/product");
    }

    const variants = await Variant.find({
      product: product._id,
      isDeleted: false,
    });

    console.log("Found:", product);

    const message = req.session.adminMessage || null;
    req.session.adminMessage = null;
    res.render("admin/product/add-variant", {
      product,
      active: "product",
      variants,
      message,
    });
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to load add variant page.",
    };

    res.redirect("/admin/product");
  }
};

export const addVariant = async (req, res) => {
  try {
    const { productId } = req.params;

    const { sku, size, concentration, stock, price, salePrice, weight } =
      req.body;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      req.session.adminMessage = {
        type: "error",
        text: "Product not found.",
      };

      return res.redirect("/admin/product");
    }

    if (!sku || !size || !concentration || !stock || !price || !weight) {
      req.session.adminMessage = {
        type: "error",
        text: "Please fill all required fields.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (sku.trim().length < 3) {
      req.session.adminMessage = {
        type: "error",
        text: "SKU must contain at least 3 characters.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (Number(size) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Invalid size.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (Number(stock) < 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Stock cannot be negative.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (Number(price) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Price must be greater than zero.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (salePrice && Number(salePrice) > Number(price)) {
      req.session.adminMessage = {
        type: "error",
        text: "Sale price cannot exceed regular price.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (Number(weight) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Weight must be greater than zero.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    if (!req.files || req.files.length < 3 || req.files.length > 5) {
      req.session.adminMessage = {
        type: "error",
        text: "Upload minimum 3 and maximum 5 images.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    const skuExists = await Variant.findOne({
      sku: sku.toUpperCase(),
    });

    if (skuExists) {
      req.session.adminMessage = {
        type: "error",
        text: "SKU already exists.",
      };

      return res.redirect(`/admin/product/${productId}/add-variant`);
    }

    const images =await Promise.all(
  req.files.map(async (file) => {
    const result = await uploadProductImage(file.buffer);

    return result.secure_url;
  }),
);

    await Variant.create({
      product: productId,

      sku: sku.toUpperCase(),

      size: Number(size),

      concentration,

      stock: Number(stock),

      price: Number(price),

      salePrice: Number(salePrice) || 0,

      weight: Number(weight),

      images,
    });

    req.session.adminMessage = {
      type: "success",
      text: "Variant added successfully.",
    };

    res.redirect(`/admin/product/${productId}/add-variant`);
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to add variant.",
    };

    res.redirect(`/admin/product/${req.params.productId}/add-variant`);
  }
};
export const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await Variant.findById(id);

    if (!variant || variant.isDeleted) {
      return res.json({
        success: false,
        message: "Variant not found",
      });
    }

    variant.isDeleted = true;
    await variant.save();

    return res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
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

    if (!sku || sku.trim().length < 3) {
      req.session.adminMessage = {
        type: "error",
        text: "SKU must contain at least 3 characters.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    const skuExists = await Variant.findOne({
      sku: sku.trim().toUpperCase(),
      _id: { $ne: variantId },
    });

    if (skuExists) {
      req.session.adminMessage = {
        type: "error",
        text: "SKU already exists.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    if (Number(size) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Invalid size.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    if (Number(stock) < 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Stock cannot be negative.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    if (Number(price) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Price must be greater than zero.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    if (salePrice && Number(salePrice) > Number(price)) {
      req.session.adminMessage = {
        type: "error",
        text: "Sale price cannot exceed regular price.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

    if (Number(weight) <= 0) {
      req.session.adminMessage = {
        type: "error",
        text: "Weight must be greater than zero.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }


    let images = [];

    if (existingImages) {
      images = Array.isArray(existingImages)
        ? existingImages.filter(Boolean)
        : [existingImages].filter(Boolean);
    }


    if (req.files && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadProductImage(file.buffer);

          return result.secure_url;
        })
      );

      images.push(...newImages);
    }

    images = images.filter(Boolean);

    

    if (images.length < 3 || images.length > 5) {
      req.session.adminMessage = {
        type: "error",
        text: "Variant must have between 3 and 5 images.",
      };

      return res.redirect(`/admin/variant/${variantId}/edit`);
    }

   

    variant.sku = sku.trim().toUpperCase();
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

    return res.redirect(
      `/admin/product/${variant.product}/add-variant`
    );
  } catch (error) {
    console.log("UPDATE VARIANT ERROR:", error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to update variant.",
    };

    return res.redirect(`/admin/variant/${req.params.variantId}/edit`);
  }
};

export const loadProductDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      req.session.adminMessage = {
        type: "error",
        text: "Product not found.",
      };
      return res.redirect("/admin/product");
    }

    const variants = await Variant.find({
      product: productId,
      isDeleted: false,
    });

    const featuredTypes = [
      { value: "bestseller", label: "Best Seller" },
      { value: "newarrival", label: "New Arrival" },
      { value: "trending", label: "Trending" },
      { value: "hidden", label: "Hidden Gem" },
      { value: "limited", label: "Limited Edition" },
      { value: "budget", label: "Budget Pick" },
    ];

    const brands = await Brand.find({
      isDeleted: false,
    });

    const categories = await Category.find({
      isDeleted: false,
    });

    const message = req.session.adminMessage || null;
    req.session.adminMessage = null;

    res.render("admin/product/product-details", {
      product,
      variants,
      brands,
      categories,
      active: "product",
      featuredTypes,
      message,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/product");
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      productName,
      description,
      brand,
      category,
      topNotes,
      heartNotes,
      baseNotes,
      occasion,
      featuredType,
    } = req.body;

    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      req.session.message = {
        type: "error",
        text: "Product not found.",
      };
      return res.redirect("/admin/product");
    }

    product.name = productName.trim();
    product.description = description.trim();
    product.brand = brand;
    product.category = category;

    product.topNotes = topNotes
      ? Array.isArray(topNotes)
        ? topNotes
        : topNotes
            .split(",")
            .map((note) => note.trim())
            .filter(Boolean)
      : [];

    product.heartNotes = heartNotes
      ? Array.isArray(heartNotes)
        ? heartNotes
        : heartNotes
            .split(",")
            .map((note) => note.trim())
            .filter(Boolean)
      : [];

    product.baseNotes = baseNotes
      ? Array.isArray(baseNotes)
        ? baseNotes
        : baseNotes
            .split(",")
            .map((note) => note.trim())
            .filter(Boolean)
      : [];

    product.occasion = occasion
      ? Array.isArray(occasion)
        ? occasion
        : [occasion]
      : [];

    product.featuredType = featuredType || null;

    await product.save();

    req.session.adminMessage = {
      type: "success",
      text: "Product updated successfully.",
    };

    res.redirect(`/admin/product/${productId}/details`);
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to update product.",
    };

    res.redirect(`/admin/product/${req.params.productId}/details`);
  }
};

export const softDeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    await Product.findByIdAndUpdate(productId, {
      isDeleted: true,
    });

    await Variant.updateMany({ product: productId }, { isDeleted: true });

    req.session.adminMessage = {
      type: "success",
      text: "Product deleted successfully.",
    };

    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to delete product.",
    };

    res.redirect("/admin/product");
  }
};

export const toggleProductListing = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      req.session.message = {
        type: "error",
        text: "Product not found.",
      };
      return res.redirect("/admin/product");
    }

    product.isListed = !product.isListed;

    await product.save();

    req.session.adminMessage = {
      type: "success",
      text: product.isListed
        ? "Product listed successfully."
        : "Product unlisted successfully.",
    };

    res.redirect(`/admin/product/${productId}/details`);
  } catch (error) {
    console.log(error);

    req.session.adminMessage = {
      type: "error",
      text: "Unable to update listing status.",
    };

    res.redirect("/admin/product");
  }
};
