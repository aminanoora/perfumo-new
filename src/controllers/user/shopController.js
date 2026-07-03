import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Brand from "../../models/Brand.js";
import Category from "../../models/Category.js";
import Wishlist from "../../models/Wishlist.js";
import Cart from "../../models/Cart.js";
import Review from "../../models/Review.js";
import mongoose from "mongoose";

export const loadShop = async (req, res) => {

    try {

        
        const page = parseInt(req.query.page) || 1;

        const limit = 9;

        const skip = (page - 1) * limit;

        const search = req.query.search || "";

        const sort = req.query.sort || "latest";

        const featured = req.query.featured || "bestseller";

        const brands = await Brand.find({
            isDeleted: false,
            isListed: true
        });

        const categories = await Category.find({
            isDeleted: false,
            isListed: true
        });

        const match = {
            isDeleted: false,
            isListed: true
        };

        if (search) {

            match.name = {
                $regex: search,
                $options: "i"
            };

        }
        

        if (req.query.brand) {

         const selectedBrands = Array.isArray(req.query.brand)
    ? req.query.brand
    : [req.query.brand];

match.brand = {
    $in: selectedBrands.map(id => new mongoose.Types.ObjectId(id))
};

        }
        if(req.query.featured){

    match.featuredType = req.query.featured;

}

if (req.query.note) {
    match.$or = [
        { topNotes: req.query.note },
        { heartNotes: req.query.note },
        { baseNotes: req.query.note }
    ];
}

        if (req.query.category) {

            const selectedCategories = Array.isArray(req.query.category)
                ? req.query.category
                : [req.query.category];


match.category = {
    $in: selectedCategories.map(id => new mongoose.Types.ObjectId(id))
};
        }

       
        if (req.query.occasion) {

            const occasions = Array.isArray(req.query.occasion)
                ? req.query.occasion
                : [req.query.occasion];

            match.occasion = {
                $in: occasions
            };

        }

        const pipeline = [

            {
                $match: match
            },

            {
                $lookup: {
                    from: "brands",
                    localField: "brand",
                    foreignField: "_id",
                    as: "brand"
                }
            },

            {
                $unwind: "$brand"
            },

            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },

            {
                $unwind: "$category"
            },

            {
                $lookup: {
                    from: "variants",
                    localField: "_id",
                    foreignField: "product",
                    as: "variants"
                }
            },

            {
                $unwind: "$variants"
            },

            {
                $match: {
                    "variants.isDeleted": false
                }
            }

        ];

        if (req.query.size) {

            const sizes = Array.isArray(req.query.size)
                ? req.query.size.map(Number)
                : [Number(req.query.size)];

            pipeline.push({

                $match: {
                    "variants.size": {
                        $in: sizes
                    }
                }

            });

        }

        if (req.query.concentration) {

            const concentration = Array.isArray(req.query.concentration)
                ? req.query.concentration
                : [req.query.concentration];

            pipeline.push({

                $match: {
                    "variants.concentration": {
                        $in: concentration
                    }
                }

            });

        }

        if (req.query.price) {

            const ranges = Array.isArray(req.query.price)
                ? req.query.price
                : [req.query.price];

            const conditions = [];

            ranges.forEach(range => {

                if (range === "0-1000") {

                    conditions.push({
                        "variants.price": {
                            $lte: 1000
                        }
                    });

                }

                if (range === "1000-3000") {

                    conditions.push({
                        "variants.price": {
                            $gte: 1000,
                            $lte: 3000
                        }
                    });

                }

                if (range === "3000-5000") {

                    conditions.push({
                        "variants.price": {
                            $gte: 3000,
                            $lte: 5000
                        }
                    });

                }

                if (range === "5000+") {

                    conditions.push({
                        "variants.price": {
                            $gte: 5000
                        }
                    });

                }

            });

            if (conditions.length) {

                pipeline.push({

                    $match: {
                        $or: conditions
                    }

                });

            }

        }

        let sortOption = {
            createdAt: -1
        };

        if (sort === "priceLow") {

            sortOption = {
                "variants.price": 1
            };

        }

        if (sort === "priceHigh") {

            sortOption = {
                "variants.price": -1
            };

        }

        if (sort === "name") {

            sortOption = {
                name: 1
            };

        }

        pipeline.push({

            $sort: sortOption

        });

        const countPipeline = [...pipeline];

        countPipeline.push({
            $count: "total"
        });

        const totalResult = await Product.aggregate(countPipeline);

        const totalProducts = totalResult.length
            ? totalResult[0].total
            : 0;

        pipeline.push({

            $skip: skip

        });

        pipeline.push({

            $limit: limit

        });

        const products = await Product.aggregate(pipeline);
        

const message = req.session.message || null;
req.session.message = null;

res.render("user/shop/shop", {

    products,

    brands,

    categories,

    search,

    sort,

    currentPage: page,

    totalPages: Math.ceil(totalProducts / limit),

    message,

    featured,

     query: req.query,

     user: req.session.user

});

    }

    catch (error) {

        console.log(error);

        res.redirect("/");

    }

};

export const loadProductDetails = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id)
            .populate("brand")
            .populate("category");

        if (
            !product ||
            product.isDeleted ||
            !product.isListed
        ) {

            return res.redirect("/shop");
        }

        const variants = await Variant.find({

            product: product._id,

            isDeleted: false

        });

        if (!variants.length) {

            return res.redirect("/shop");
        }

       let selectedVariant;

if (req.query.variant) {

    selectedVariant = variants.find(
        v => v._id.toString() === req.query.variant
    );

}

if (!selectedVariant) {
    selectedVariant = variants[0];
}

        const reviews = await Review.find({

            product: product._id

        }).populate("user");

        const reviewCount = reviews.length;

        let averageRating = 0;

        if (reviewCount > 0) {

            averageRating =
                reviews.reduce(
                    (sum, item) => sum + item.rating,
                    0
                ) / reviewCount;
        }

        let discountPercentage = 0;

        if (
           selectedVariant.salePrice &&
            selectedVariant.salePrice < selectedVariant.price
        ) {

            discountPercentage = Math.round(

                ((selectedVariant.price - selectedVariant.salePrice)
                    / selectedVariant.price) * 100

            );

        }

        const estimatedDelivery = new Date();

        estimatedDelivery.setDate(

            estimatedDelivery.getDate() + 5

        );

        const products = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isDeleted: false,
    isListed: true
})
.populate("brand")
.limit(4);

const relatedProducts = await Promise.all(

    products.map(async (item) => {

        const variant = await Variant.findOne({
            product: item._id,
            isDeleted: false
        });

        return {
            product: item,
            variant
        };
    })

);
        let inWishlist = false;

        let inCart = false;

        if (req.session.user) {

            const wishlist = await Wishlist.findOne({

                user: req.session.user.id,

                product: product._id

            });

            inWishlist = !!wishlist;

            const cart = await Cart.findOne({

                user: req.session.user.id,

                "items.variant":selectedVariant._id

            });

            inCart = !!cart;

        }

        const breadcrumbs = [

            {
                title: "Home",
                link: "/"
            },

            {
                title: product.category.name,
                link: `/shop?category=${product.category._id}`
            },

            {
                title: product.name
            }

        ];

        res.render(
            'user/shop/product-details',
            {

                product,

                selectedVariant,

                variants,

                reviews,

                 reviewCount,

             averageRating,

    discountPercentage,

    estimatedDelivery,

    relatedProducts,

    inWishlist,

    inCart,

    breadcrumbs,

  

            }
        );

    } catch (err) {

        console.log(err);

        res.redirect("/shop");

    }

};