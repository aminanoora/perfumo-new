import User from '../models/User.js';

const userAuth = async (req, res, next) => {

    try {

        if (!req.session.user) {

            return res.redirect('/signin');
        }

        const user = await User.findById(
            req.session.user.id
        );

        if (!user) {

            req.session.destroy();

            return res.redirect('/signin');
        }

        if (user.isBlocked) {

            req.session.destroy();

            return res.redirect(
                '/signin?message=blocked'
            );
        }

        next();

    } catch (error) {

        console.log(error);

        res.redirect('/signin');
    }
};

export default userAuth;