import cartCount from "../../middleware/cartCount.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Wishlist from "../../models/Wishlist.js";

export const loadCart = async (req, res) => {

    try {

        const userId = req.session.user.id;

        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: "items.variant",
                populate: {
                    path: "product",
                    populate: [
                        {
                            path: "brand"
                        },
                        {
                            path: "category"
                        }
                    ]
                }
            });

        if (!cart) {

            cart = {
                items: [],
                giftWrap: false
            };

        }

        let subtotal = 0;

        let shipping = 0;

        let giftWrapAmount = cart.giftWrap ? 30 : 0;

        let discount = 0;

        let hasUnavailableProducts = false;

        cart.items.forEach(item => {

            const variant = item.variant;

            if (
                !variant ||
                variant.isDeleted ||
                variant.product.isDeleted ||
                !variant.product.isListed ||
                variant.stock <= 0
            ) {

                hasUnavailableProducts = true;

                return;

            }

            const price =
                variant.salePrice > 0
                    ? variant.salePrice
                    : variant.price;

            subtotal += price * item.quantity;

        });

        if (subtotal >= 999) {

            shipping = 0;

        } else {

            shipping = 100;

        }

        const grandTotal =
            subtotal +
            shipping +
            giftWrapAmount -
            discount;

        res.render(
            "user/cart/cart",
            {
                cart,
                subtotal,
                shipping,
                giftWrapAmount,
                discount,
                grandTotal,
                hasUnavailableProducts
            }
        );

    } catch (error) {

        console.log(error);

        res.redirect("/");

    }

};

export const addToCart = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const { variantId, quantity } = req.body;

        const variant = await Variant.findById(variantId)
            .populate("product");

        if (
            !variant ||
            variant.isDeleted ||
            variant.product.isDeleted ||
            !variant.product.isListed
        ) {

            return res.json({
                success: false,
                message: "Product unavailable."
            });

        }

        if (variant.stock <= 0) {

            return res.json({
                success: false,
                message: "Out of stock."
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

        const existing = cart.items.find(
            item =>
                item.variant.toString() ===
                variantId
        );

        if (existing) {

            const newQty =
                existing.quantity +
                Number(quantity);

            if (newQty > 10) {

                return res.json({
                    success: false,
                    message: "Maximum quantity reached."
                });

            }

            if (newQty > variant.stock) {

                return res.json({
                    success: false,
                    message: "Stock limit exceeded."
                });

            }

            existing.quantity = newQty;

        } else {

            cart.items.push({

                variant: variantId,

                quantity

            });

        }

        await cart.save();

        delete req.session.coupon;


        await Wishlist.deleteOne({

            user: userId,

            product: variant.product._id

        });

        const totalCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
);

        res.json({

            success: true,

            message: "Added to cart.",

            cartCount:totalCount


        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message: "Something went wrong."

        });

    }

};

export const updateCartQuantity = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const {
            itemId,
            action
        } = req.body;

    const cart = await Cart.findOne({
    user: userId
}).populate({
    path: "items.variant",
    populate: {
        path: "product"
    }
});

        const item = cart.items.id(itemId);
        if (!cart) {

    return res.json({
        success:false,
        message:"Cart not found"
    });

}

        if (!item) {

            return res.json({
                success: false
            });

        }

       if (action === "increase") {

   if (
    item.variant.isDeleted ||
    item.variant.product.isDeleted ||
    !item.variant.product.isListed
) {

    return res.json({
        success: false,
        message: "This product is currently unavailable."
    });

}

    if (item.variant.stock <= 0) {

        return res.json({
            success: false,
            message: "This product is out of stock."
        });

    }

    if (item.quantity >= item.variant.stock) {

        return res.json({
            success: false,
            message: `Only ${item.variant.stock} item(s) available in stock.`
        });

    }

    if (item.quantity >= 10) {

        return res.json({
            success: false,
            message: "Maximum quantity allowed is 10."
        });

    }

    item.quantity++;

}
        if (action === "decrease") {

            if (item.quantity > 1) {

                item.quantity--;

            }

        }

        await cart.save();

        delete req.session.coupon;

       const totalCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
);

res.json({

    success: true,

    quantity: item.quantity,

    cartCount: totalCount

});
    } catch (error) {

        console.log(error);

        res.json({

            success: false

        });

    }

};
export const removeCartItem = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const cart = await Cart.findOne({
            user: userId
        });

        cart.items.pull(req.params.itemId);

        await cart.save();

        delete req.session.coupon;
        
     const totalCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
);

res.json({

    success: true,

    message: "Item removed.",

    cartCount: totalCount

});

    } catch (error) {

        console.log(error);

        res.json({

            success: false

        });

    }

};

export const toggleGiftWrap = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const cart = await Cart.findOne({
            user: userId
        });

        if(!cart){

    return res.json({
        success:false
    });

}

        cart.giftWrap = !cart.giftWrap;

        await cart.save();

        res.json({

            success: true,

            giftWrap: cart.giftWrap

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false

        });

    }

};