import express from 'express';

import passport from 'passport';

const router = express.Router();

router.get(

    '/google',

    passport.authenticate(
        'google',
        {
            scope: ['profile', 'email']
        }
    )
);

router.get(

    '/google/callback',

    passport.authenticate(
        'google',
        {
            failureRedirect: '/signin'
        }
    ),

    (req, res) => {

        req.session.user = {

            id: req.user._id,

            firstName: req.user.firstName,

            lastName: req.user.lastName,

            email: req.user.email
        };

        res.redirect('/');
    }
);

export default router;