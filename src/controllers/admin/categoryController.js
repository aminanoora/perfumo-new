import Category from "../../models/Category.js";
import Product from "../../models/Product.js";



export const getCategoriesPage = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const search = req.query.search?.trim() || "";
        const sort = req.query.sort || "desc";

        const query = {};

        if (search) {
            query.name = {
                $regex: search,
                $options: "i"
            };
        }

        const sortOption = {
            createdAt: sort === "asc" ? 1 : -1
        };

        const totalCategories = await Category.countDocuments(query);

        const categories = await Category.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        for (const category of categories) {

            category.productCount = await Product.countDocuments({
                category: category._id
            });

            const brands = await Product.distinct("brand", {
                category: category._id
            });

            category.brandCount = brands.length;
        }

        const message = req.session.message;

       req.session.message = null;


        res.render("admin/categories/categories", {
            categories,
            page,
            totalPages: Math.ceil(totalCategories / limit),
            search,
            sort,
            active: "category",
            message
        });
        
       

    } catch (error) {

        console.log(error);
        res.redirect("/admin/dashboard");

    }

};


export const loadAddCategory = async (req, res) => {

    try {

        const parentCategories = await Category.find({
            parentCategory: null
        });
        
        const message = req.session.message;

req.session.message = null;


        res.render("admin/categories/add-category", {
            parentCategories,
            active:"category",
            message
        });
         

    } catch (error) {

        console.log(error);

        res.redirect("/admin/categories");

    }

};

export const addCategory = async (req, res) => {
    try {

        const {
            name,
            slug,
            parentCategory,
            description
        } = req.body;

        const image = req.file
            ? "/admin/uploads/categories/" + req.file.filename
            : "";

        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {

            req.session.message = {
                type: "error",
                text: "Category already exists!"
            };

            return res.redirect("/admin/categories/add");
        }

        const category = new Category({
            name,
            slug,
            parentCategory: parentCategory || null,
            description,
            image
        });

        await category.save();

        req.session.message = {
            type: "success",
            text: "Category added successfully!"
        };

        res.redirect("/admin/categories");

    } catch (error) {

        console.log(error);

        req.session.message = {
            type: "error",
            text: "Something went wrong!"
        };

        res.redirect("/admin/categories/add");
    }
};




export const loadEditCategory = async (req, res) => {

    try {

        const category =
            await Category.findById(req.params.id);

        if (!category) {

            return res.redirect("/admin/categories");

        }

        res.render(

            "admin/categories/edit-category",

            { category }
            
        );

    } catch (error) {

        console.log(error);

        res.redirect("/admin/categories");

    }

};




export const updateCategory = async (req, res) => {

    try {

        const {

            name,

            description

        } = req.body;

        await Category.findByIdAndUpdate(

            req.params.id,

            {

                name,

                description

            }

        );

        res.json({

            success: true,

            message: "Category updated"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message: "Server Error"

        });

    }

};




export const categoryDetails = async (req, res) => {

    try {

        const category =
            await Category.findById(req.params.id);

        const products =
            await Product.find({

                category: req.params.id

            });

        const brands =
            await Product.distinct(

                "brand",

                {

                    category: req.params.id

                }

            );

        res.render(

            "admin/categories/category-details",

            {

                category,

                products,

                brands,
                 active: "categories"

            }

        );

    } catch (error) {

        console.log(error);

        res.redirect("/admin/categories");

    }

};




export const listCategory = async (req, res) => {

    try {

        await Category.findByIdAndUpdate(

            req.params.id,

            {

                isListed: true

            }

        );

        res.redirect("/admin/categories");

    } catch (error) {

        console.log(error);

        res.redirect("/admin/categories");

    }

};




export const unlistCategory = async (req, res) => {

    try {

        await Category.findByIdAndUpdate(

            req.params.id,

            {

                isListed: false

            }

        );

        res.redirect("/admin/categories");

    } catch (error) {

        console.log(error);

        res.redirect("/admin/categories");

    }

};



export const deleteCategory = async (req, res) => {

    try {

        await Category.findByIdAndUpdate(

            req.params.id,

            {

                isDeleted: true

            }

        );

        res.json({

            success: true,

            message: "Category deleted"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message: "Server Error"

        });

    }

};