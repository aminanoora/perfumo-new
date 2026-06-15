import express from 'express';

import {
    loadProfile,
    updateProfile,
    verifyProfileOTP,
    resendProfileOTP,
    loadChangePassword,
    changePassword,
    loadAddress,
     loadAddAddressPage,
    addAddress,
     loadEditAddressPage,
      updateAddress,
      deleteAddress
} from '../../controllers/user/profileController.js';

import userAuth from '../../middleware/userAuth.js';

import noCache from '../../middleware/noCache.js';

const router = express.Router();

router.get('/profile', userAuth,noCache,loadProfile);

router.post('/profile/update', updateProfile);

router.get('/profile/verifyemail', userAuth,noCache, (req, res) => {
    res.render('user/profile/verifyemail');
});

router.post('/profile/verifyemail', verifyProfileOTP);

router.post('/profile/resend-otp', resendProfileOTP);

router.get('/profile/editpassword', userAuth,noCache, loadChangePassword);


router.post('/profile/editpassword', changePassword);

router.get('/profile/address', userAuth,noCache,loadAddress);



router.get(
    '/address/add-address',
    userAuth,
    noCache,
    loadAddAddressPage
);

router.post(
    '/address/add-address',
    userAuth,
    addAddress
);
router.get(
    '/address/edit-address/:id',
    userAuth,
    noCache,
    loadEditAddressPage
);

router.put(
    '/address/edit-address/:id',
    userAuth,
    updateAddress
);

router.delete(
    '/address/delete/:id',
    userAuth,
    deleteAddress
);

export default router;