import Wishlist from "../../models/Wishlist.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Cart from "../../models/Cart.js";



export const loadWishlist = async (req, res) => {

    try {

        const userId = req.session.user.id;

        let wishlist = await Wishlist.findOne({ user: userId })

            .populate({
    path: "products.variant",
    populate: {
        path: "product",
        populate: [
            { path: "brand" },
            { path: "category" }
        ]
    }
});

        if (!wishlist) {

            wishlist = {
                products: []
            };

        }

        res.render("user/cart/wishlist", {

            wishlist,
            user: req.session.user

        });

    } catch (error) {

        console.log(error);

        res.redirect("/");

    }

};


export const addToWishlist = async (req, res) => {

    try {


         console.log("Reached wishlist");

    console.log(req.body);

    console.log(req.session.user);


        const userId = req.session.user.id;

       const { variantId } = req.body;

        const variant = await Variant.findById(variantId);

if (!variant) {
    return res.json({
        success: false,
        message: "Variant not found"
    });
}

        let wishlist = await Wishlist.findOne({

            user: userId

        });

        if (!wishlist) {

            wishlist = new Wishlist({

                user: userId,
                products: []

            });

        }

       const exists = wishlist.products.find(item =>
    item.variant.toString() === variantId
);

        if (exists) {

            return res.json({

                success: false,
                message: "Already in wishlist"

            });

        }

       wishlist.products.push({
    variant: variantId
});
        await wishlist.save();

        res.json({

            success: true,
            message: "Added to wishlist"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,
            message: "Something went wrong"

        });

    }

};

export const removeFromWishlist = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const { variantId } = req.body;

       await Wishlist.findOneAndUpdate(
    { user: userId },
    {
        $pull: {
            products: {
                variant: variantId
            }
        }
    }
);

        res.json({

            success: true,
            message: "Removed"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,
            message: "Unable to remove"

        });

    }

};

export const moveToCart = async (req, res) => {

    try {

        const userId = req.session.user.id;

       const { variantId } = req.body;
        
const variant = await Variant.findOne({
    _id: variantId,
    isDeleted: false
});

        if (!variant) {

            return res.json({

                success: false,
                message: "Product is out of stock"

            });

        }

        let cart = await Cart.findOne({

            user: userId

        });

        if (!cart) {

            cart = new Cart({

                user: userId,
                items: []

            });

        }

        const existing = cart.items.find(item =>

            item.variant.toString() === variant._id.toString()

        );

        if (existing) {

            if (existing.quantity >= variant.stock) {

                return res.json({

                    success: false,
                    message: "Stock limit reached"

                });

            }

            existing.quantity++;

        } else {

            cart.items.push({

                variant: variant._id,
                quantity: 1

            });

        }

        await cart.save();

     await Wishlist.findOneAndUpdate(
    { user: userId },
    {
        $pull: {
            products: {
                variant: variantId
            }
        }
    }
);


        res.json({

            success: true,
            message: "Moved to cart"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,
            message: "Something went wrong"

        });

    }

};