import Cart from "../models/Cart.js";

export const cartCount = async (req, res, next) => {

    try {

        res.locals.cartCount = 0;

        if (req.session.user) {

            const cart = await Cart.findOne({
                user: req.session.user.id
            });

            if (cart) {

                res.locals.cartCount = cart.items.reduce(
                    (total, item) => total + item.quantity,
                    0
                );

            }

        }

        next();

    } catch (error) {

        console.log(error);

        next();

    }

};

export default cartCount;