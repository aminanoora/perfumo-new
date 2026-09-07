import Brand from "../../models/Brand.js";
import Product from "../../models/Product.js";

export const getBrandsPage = async ({
  page = 1,
  limit = 5,
  search = "",
  sort = "desc",
  status = "",
}) => {
  const skip = (page - 1) * limit;

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

  return {
    brands,
    totalBrands,
  };
};


export const addBrand  = async({name ,slug , description,file})=>{
  const brandName = name.trim();
  const brandSlug = slug.trim().toLowerCase();
  const nameRegex =  /^[A-Za-z\s.'&-]+$/;

  if(!brandName ||brandName.length <4){
    throw new Error("Brand name should contain 4 characters");
   
  }

  if(!nameRegex.test(brandName)){
    throw new Error("Brand name can contain only letters.")
  }
 if(!brandSlug || brandSlug.length < 4){
    throw new Error("Slug must cotain atlest 4 characters");
 }

 if(!description || description.trim().length < 4){
  throw new Error('description must contain atleat 4 charcters');
 }

   const existingName = await Brand.findOne({
      name: { $regex: new RegExp("^" + brandName + "$", "i") },
      isDeleted: false,
    });

    if(existingName){
      throw new Error('Brand already exists.');
    }
    const existingSlug = await Brand.findOne({
      slug: brandSlug,
      isDeleted: false,
    });

    if (existingSlug) {
      throw new Error("Slug already exists.")
    }

    const logo = file?  "/admin/uploads/brands/"+ file.filename : "";

    const brand = new Brand({
          name: brandName,
          slug: brandSlug,
          description,
          logo,
          isListed: true,
          isDeleted: false,
        });

    return await brand.save();
}

export const updateBrandBrand = async ({ id, name, slug, description, removeLogo, file }) => {
  const brand = await Brand.findById(id);

  if (!brand) {
    throw new Error('Brand not found.');
  }

  const brandName = name.trim();
  const brandSlug = slug.trim().toLowerCase();
  const brandDescription = description.trim();

  const nameRegex = /^[A-Za-z\s.'&-]+$/;
  const slugRegex = /^[a-z0-9-]+$/;

  if (!brandName || brandName.length < 4) {
    throw new Error('Brand name must contain at least 4 characters.');
  }

  if (!nameRegex.test(brandName)) {
    throw new Error('Brand name can contain only letters.');
  }

  if (!brandSlug || brandSlug.length < 4) {
    throw new Error("Slug must contain at least 4 characters.");
  }

  if (!slugRegex.test(brandSlug)) {
    throw new Error("Slug can contain only lowercase letters, numbers and hyphens.");
  }

  if (!brandDescription || brandDescription.length < 4) {
    throw new Error("Description must contain at least 4 characters.");
  }

  
  const existingBrand = await Brand.findOne({
    name: { $regex: new RegExp("^" + brandName + "$", "i") },
    _id: { $ne: id }, 
    isDeleted: false,
  });

  if (existingBrand) {
    throw new Error("Brand name already exists.");
  }

  
  const existingSlug = await Brand.findOne({
    slug: brandSlug,
    _id: { $ne: id },
    isDeleted: false,
  });

  if (existingSlug) {
    throw new Error("Slug already exists.");
  }

  let logo = brand.logo;


  if (removeLogo === "true") {
    logo = "";
  }

 
  if (file) {
    logo = "/admin/uploads/brands/" + file.filename;
  }

  
  const updatedBrand = await Brand.findByIdAndUpdate(
    id,
    {
      name: brandName,
      slug: brandSlug,
      description: brandDescription,
      logo,
    },
    { new: true } 
  );

  return updatedBrand;
};
