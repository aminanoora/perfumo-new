import Category from "../../models/Category.js";
import Product from "../../models/Product.js";

export const getCategoriesService = async ({ page = 1, limit = 5, search = "", sort = "desc" }) => {
  const parsedPage = parseInt(page) || 1;
  const skip = (parsedPage - 1) * limit;
  const cleanSearch = search?.trim() || "";

  const query = { isDeleted: false };

  if (cleanSearch) {
    query.name = {
      $regex: cleanSearch,
      $options: "i",
    };
  }

  const sortOption = {
    createdAt: sort === "asc" ? 1 : -1,
  };

  const totalCategories = await Category.countDocuments(query);

  const categories = await Category.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  
  for (const category of categories) {
    category.productCount = await Product.countDocuments({
      category: category._id,
    });

    const brands = await Product.distinct("brand", {
      category: category._id,
    });

    category.brandCount = brands.length;
  }

  
  return {
    categories,
    totalPages: Math.ceil(totalCategories / limit),
    page: parsedPage,
    search: cleanSearch,
    sort
  };
};
