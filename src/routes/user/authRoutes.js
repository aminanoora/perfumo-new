import express from 'express';
import {
    loadSignup,
    signup,
    loadSignin,
    signin,
    verifyOTP,
    resendOTP,
    loadForgotPassword,
    forgotPassword,
    resendForgotOTP,
    resetPassword,
    verifyResetCode,
     checkBlockStatus
} from '../../controllers/user/authController.js';
import userLoggedin from '../../middleware/userLoggedin.js';
import noCache from '../../middleware/noCache.js';
import Category from "../../models/Category.js";
import Product from "../../models/Product.js";

const router = express.Router();


router.get("/", async (req, res) => {
    try {

        const categories = await Category.find({
            isDeleted: false,
            isListed: true
        });
let featured = req.query.featured || "bestseller";

          const featuredProducts = await Product.aggregate([

        {
            $match: {
                isDeleted: false,
                isListed: true,
                featuredType: featured
            }
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
        },

        {
            $limit: 3
        }

    ]);

        res.render("user/home/home", {
            user: req.session.user,
            categories,
            featured,
            featuredProducts
        });

    } catch (error) {
        console.log(error);
        res.redirect("/");
    }
});
router.get('/signup',userLoggedin,noCache, loadSignup);

router.post('/signup', signup);

router.get('/signin',userLoggedin,noCache, loadSignin);

router.post('/signin', signin);

router.post('/verify-otp', verifyOTP);




router.get('/verify-otp',userLoggedin,noCache,(req, res) => {
    res.render('user/auth/verify-otp');
});

router.post('/resend-otp', resendOTP);
router.get('/forgot-password',userLoggedin,noCache, loadForgotPassword);

router.post('/forgot-password', forgotPassword);

router.get('/code-reset-password',userLoggedin,noCache,(req,res)=>{
    res.render('user/auth/code-reset-password')
})
router.get('/new-password',userLoggedin,noCache, (req, res) => {

    res.render('user/auth/new-password');
});

router.post('/verify-forgot-otp', verifyResetCode);

router.post('/resend-forgot-otp', resendForgotOTP);


router.post('/reset-password', resetPassword);

router.get('/logout',noCache, (req, res) => {

      delete req.session.user;

        res.redirect('/');
   
});
router.get("/check-block-status",noCache, checkBlockStatus);

export default router;