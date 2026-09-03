import Brand from "../../models/Brand.js";
import Product from "../../models/Product.js";
import * as brandService from "../../services/admin/brandService.js"

export const getBrandsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const search = req.query.search?.trim() || "";
    const sort = req.query.sort || "desc";
    const status = req.query.status || "";

    const result = await brandService.getBrandsPage({
      page,
      limit,
      search,
      sort,
      status,
    });

    const message = req.session.message;
    req.session.message = null;

    return res.render("admin/brand/brand", {
      brands: result.brands,
      page,
      totalPages: Math.ceil(result.totalBrands / limit),
      search,
      sort,
      status,
      active: "brand",
      message,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/admin/brand/brand");
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
    await brandService.addBrand({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      file: req.file,
    })

    req.session.message = {
      type: "success",
      text: "Brand added successfully.",
    };

    return res.redirect("/admin/brand");
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: error.message||"Unable to add brand.",
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

       await brandService.updateBrandBrand({
      id: brandId,
      name,
      slug,
      description,
      removeLogo,
      file: req.file 
    });

    req.session.message = {
      type: "success",
      text: "Brand updated successfully.",
    };

    return res.redirect(`/admin/brand/edit/${brandId}`);
  } catch (error) {
    console.log(error);

    req.session.message = {
      type: "error",
      text: "Unable to update brand."||error.message,
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
