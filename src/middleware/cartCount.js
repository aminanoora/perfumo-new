import Cart from "../models/Cart.js";

const cartCount = async (req, res, next) => {

    res.locals.cartCount = 0;

    if (!req.session) {
        return next();
    }

    if (req.session.user) {

        const cart = await Cart.findOne({
            user: req.session.user.id  
        });

        if (cart) {
            res.locals.cartCount = cart.items.length;
        }
    }

    next();
};

export default cartCount;