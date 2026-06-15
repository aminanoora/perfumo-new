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


const router = express.Router();


router.get('/', noCache,(req, res) => {

    console.log(req.session.user);

    res.render('user/home/home', {
        user: req.session.user
    });
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

    req.session.destroy(() => {

        res.redirect('/');
    });
});
router.get("/check-block-status",noCache, checkBlockStatus);

export default router;