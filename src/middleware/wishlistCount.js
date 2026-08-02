import Wishlist from "../models/Wishlist.js";

export const wishlistCount = async (req, res, next) => {
    try {

        res.locals.wishlistCount = 0;

        if (req.session.user) {

            const wishlist = await Wishlist.findOne({
                user: req.session.user.id
            });

            if (wishlist) {

                res.locals.wishlistCount = wishlist.products.length;

            }

        }

        next();

    } catch (error) {

        console.log(error);

        next();

    }
};

export default wishlistCount;