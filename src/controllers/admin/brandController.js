import Brand from "../../models/Brand.js";
import Product from "../../models/Product.js";

export const getBrandsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 5;

    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

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

    const totalBrands = await Brand.countDocuments(query);

    const brands = await Brand.find(query)

      .sort(sortOption)

      .skip(skip)

      .limit(limit);

    for (const brand of brands) {
      brand.productCount = await Product.countDocuments({
        brand: brand._id,
      });
    }

    const message = req.session.message;

    req.session.message = null;

    res.render("admin/brand/brand", {
      brands,

      page,

      totalPages: Math.ceil(totalBrands / limit),

      search,

      sort,

      status,

      active: "brand",

      message,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/brand/brand");
  }
};
export const loadAddBrand = async (req, res) => {
  try {
    const message = req.session.message;

    req.session.message = null;

    res.render("admin/brand/add-brand", {
      active: "brand",

      message,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/brand");
  }
};

export const addBrand = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    const brandName = name.trim();
    const brandSlug = slug.trim().toLowerCase();

    const nameRegex = /^[A-Za-z\s.'&-]+$/;

    if (!brandName || brandName.length < 4) {
      req.session.message = {
        type: "error",
        text: "Brand name must contain at least 4 characters.",
      };
      return res.redirect("/admin/brand/add");
    }

    if (!nameRegex.test(brandName)) {
      req.session.message = {
        type: "error",
        text: "Brand name can contain only letters.",
      };
      return res.redirect("/admin/brand/add");
    }

    if (!brandSlug || brandSlug.length < 4) {
      req.session.message = {
        type: "error",
        text: "Slug must contain at least 4 characters.",
      };
      return res.redirect("/admin/brand/add");
    }

    if (!description || description.trim().length < 4) {
      req.session.message = {
        type: "error",
        text: "Description must contain at least 4 characters.",
      };
      return res.redirect("/admin/brand/add");
    }

    const existingName = await Brand.findOne({
      name: { $regex: new RegExp("^" + brandName + "$", "i") },
      isDeleted: false,
    });

    if (existingName) {
      req.session.message = {
        type: "error",
        text: "Brand already exists.",
      };
      return res.redirect("/admin/brand/add");
    }

    const existingSlug = await Brand.findOne({
      slug: brandSlug,
      isDeleted: false,
    });

    if (existingSlug) {
      req.session.message = {
        type: "error",
        text: "Slug already exists.",
      };
      return res.redirect("/admin/brand/add");
    }

    const logo = req.file ? "/admin/uploads/brands/" + req.file.filename : "";

    const brand = new Brand({
      name: brandName,
      slug: brandSlug,
      description,
      logo,
      isListed: true,
      isDeleted: false,
    });

    await brand.save();

    req.session.message = {
      type: "success",
      text: "Brand added successfully.",
    };

    return res.redirect("/admin/brand");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to add brand.",
    };

    return res.redirect("/admin/brand/add");
  }
};
export const loadEditBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.isDeleted) {
      req.session.message = {
        type: "error",
        text: "Brand not found.",
      };

      return res.redirect("/admin/brand");
    }

    const message = req.session.message;
    req.session.message = null;

    res.render("admin/brand/edit-brand", {
      brand,
      active: "brand",
      message,
    });
  } catch (error) {
    console.log(error);

    return res.redirect(`/admin/brand/${brandId}`);
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { name, slug, description, removeLogo } = req.body;

    const brandId = req.params.id;

    const brand = await Brand.findById(brandId);

    if (!brand) {
      req.session.message = {
        type: "error",
        text: "Brand not found.",
      };

      return res.redirect("/admin/brand");
    }

    const brandName = name.trim();
    const brandSlug = slug.trim().toLowerCase();
    const brandDescription = description.trim();

    const nameRegex = /^[A-Za-z\s.'&-]+$/;
    const slugRegex = /^[a-z0-9-]+$/;

    if (!brandName || brandName.length < 4) {
      req.session.message = {
        type: "error",
        text: "Brand name must contain at least 4 characters.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    if (!nameRegex.test(brandName)) {
      req.session.message = {
        type: "error",
        text: "Brand name can contain only letters.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    if (!brandSlug || brandSlug.length < 4) {
      req.session.message = {
        type: "error",
        text: "Slug must contain at least 4 characters.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    if (!slugRegex.test(brandSlug)) {
      req.session.message = {
        type: "error",
        text: "Slug can contain only lowercase letters, numbers and hyphens.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    if (!brandDescription || brandDescription.length < 4) {
      req.session.message = {
        type: "error",
        text: "Description must contain at least 4 characters.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    const existingBrand = await Brand.findOne({
      name: {
        $regex: new RegExp("^" + brandName + "$", "i"),
      },

      _id: {
        $ne: brandId,
      },

      isDeleted: false,
    });

    if (existingBrand) {
      req.session.message = {
        type: "warning",
        text: "Brand name already exists.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    const existingSlug = await Brand.findOne({
      slug: brandSlug,

      _id: {
        $ne: brandId,
      },

      isDeleted: false,
    });

    if (existingSlug) {
      req.session.message = {
        type: "warning",
        text: "Slug already exists.",
      };

      return res.redirect(`/admin/brand/edit/${brandId}`);
    }

    let logo = brand.logo;

    if (removeLogo === "true") {
      logo = "";
    }

    if (req.file) {
      logo = "/admin/uploads/brands/" + req.file.filename;
    }

    await Brand.findByIdAndUpdate(
      brandId,

      {
        name: brandName,
        slug: brandSlug,
        description: brandDescription,
        logo,
      },
    );

    req.session.message = {
      type: "success",
      text: "Brand updated successfully.",
    };

    return res.redirect(`/admin/brand/edit/${brandId}`);
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to update brand.",
    };

    return res.redirect(`/admin/brand/edit/${req.params.id}`);
  }
};
export const brandDetails = async (req, res) => {
  try {
    const brandId = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const brand = await Brand.findById(brandId);

    if (!brand || brand.isDeleted) {
      req.session.message = {
        type: "error",
        text: "Brand not found.",
      };

      return res.redirect("/admin/brand");
    }

    const query = {
      brand: brand._id,
      isDeleted: false,
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

    const message = req.session.message;
    req.session.message = null;

    res.render("admin/brand/brand-details", {
      brand,
      products,
      page,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      search,
      active: "brand",
      message,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/brand");
  }
};
export const listBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      req.session.message = {
        type: "error",

        text: "Brand not found.",
      };

      return res.redirect("/admin/brand");
    }

    brand.isListed = true;

    await brand.save();

    req.session.message = {
      type: "success",

      text: "Brand listed successfully.",
    };

    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",

      text: "Unable to list brand.",
    };

    res.redirect("/admin/brand");
  }
};
export const unlistBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      req.session.message = {
        type: "error",

        text: "Brand not found.",
      };

      return res.redirect("/admin/brand");
    }

    brand.isListed = false;

    await brand.save();

    req.session.message = {
      type: "success",

      text: "Brand hidden successfully.",
    };

    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",

      text: "Unable to hide brand.",
    };

    res.redirect("/admin/brand");
  }
};
export const deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    const brand = await Brand.findById(brandId);

    const productExists = await Product.exists({
      brand: brand.name,
    });

    if (productExists) {
      return res.json({
        success: false,

        message: "Cannot delete brand because products exist under it.",
      });
    }

    await Brand.findByIdAndUpdate(
      brandId,

      {
        isDeleted: true,

        isListed: false,
      },
    );

    return res.json({
      success: true,

      message: "Brand deleted successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: "Something went wrong.",
    });
  }
};
