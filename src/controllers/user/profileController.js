import User from '../../models/User.js';

import Address from '../../models/Address.js';

import { sendOTP } from '../../services/mailService.js';

import bcrypt from 'bcrypt';

export const loadProfile = async (req, res) => {

    try {

        const user = await User.findById(req.session.user.id);

        res.render('user/profile/profile', {
            user
        });

    } catch (error) {

        console.log(error);

        res.redirect('/');
    }
};

export const updateProfile = async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            email
        } = req.body;

        const user = await User.findById(req.session.user.id);

        if (!user) {

            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        const emailChanged = user.email !== email;

        if (!emailChanged) {

            user.firstName = firstName;
            user.lastName = lastName;

            await user.save();

            req.session.user.firstName = user.firstName;
            req.session.user.lastName = user.lastName;

            return res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {

            return res.json({
                success: false,
                message: 'Email already exists'
            });
        }

        const otp =
            Math.floor(100000 + Math.random() * 900000);

        req.session.pendingProfileUpdate = {

            userId: user._id,

            firstName,
            lastName,

            email,

            otp,

            otpExpiry: Date.now() + 300000
        };

         sendOTP(email, otp);

        console.log("PROFILE OTP:", otp);

        return res.json({
            success: true,
            requiresOTP: true
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

export const verifyProfileOTP = async (req, res) => {

     try {

        const { otp } = req.body;

        const pending =
        req.session.pendingProfileUpdate;

        if (!pending) {

            return res.json({
                success: false,
                message: 'Session expired'
            });
        }

        if (
            String(pending.otp)
            !== String(otp)
        ) {

            return res.json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (
            pending.otpExpiry < Date.now()
        ) {

            return res.json({
                success: false,
                message: 'OTP expired'
            });
        }

        const user =
        await User.findById(pending.userId);

        if (!user) {

            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        user.firstName = pending.firstName;
        user.lastName = pending.lastName;
        user.email = pending.email;

        await user.save();

        req.session.user.firstName =
        pending.firstName;

        req.session.user.lastName =
        pending.lastName;

        req.session.user.email =
        pending.email;

        delete req.session.pendingProfileUpdate;

        return res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }

};

export const resendProfileOTP = async (req, res) => {

    try {

        const pending =
            req.session.pendingProfileUpdate;

        if (!pending) {

            return res.json({
                success: false,
                message: 'Session expired'
            });
        }

        const newOTP =
            Math.floor(100000 + Math.random() * 900000);

        pending.otp = newOTP;

        pending.otpExpiry =
            Date.now() + 300000;

        req.session.pendingProfileUpdate =
            pending;

        await sendOTP(
            pending.email,
            newOTP
        );

        console.log("NEW PROFILE OTP:", newOTP);

        return res.json({
            success: true,
            message: 'OTP resent successfully'
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: 'Failed to resend OTP'
        });
    }
};
export const loadChangePassword = async (req, res) => {

    try{

        const user =
        await User.findById(req.session.user.id);

        res.render('user/profile/editpassword', {
            user
        });

    }catch(error){

        console.log(error);

        res.redirect('/profile');
    }
};

export const changePassword = async (req, res) => {

    try{

        const {
            oldPassword,
            newPassword
        } = req.body;

        const user =
        await User.findById(req.session.user.id);

        if(!user){

            return res.json({
                success:false,
                message:'User not found'
            });
        }

        const isMatch =
        await bcrypt.compare(
            oldPassword,
            user.password
        );

        if(!isMatch){

            return res.json({
                success:false,
                message:'Old password is incorrect'
            });
        }
        const samePassword =
          await bcrypt.compare(
          newPassword,
         user.password
            );

         if(samePassword){

        return res.json({
        success:false,
        message:'New password cannot be same as old password'
       });
}

        const hashedPassword =
        await bcrypt.hash(newPassword, 10);

        user.password =
        hashedPassword;

        await user.save();

        return res.json({
            success:true,
            message:'Password updated successfully'
        });

    }catch(error){

        console.log(error);

        return res.json({
            success:false,
            message:'Something went wrong'
        });
    }
};
export const loadAddress = async (req, res) => {

    try {

       const user = await User.findById(req.session.user.id);

     const addresses =await Address.find({
    userId:req.session.user.id
});

        res.render('user/profile/address', {
            user,
            addresses
        });

    } catch (error) {

        console.log(error);

        res.redirect('/profile');
    }
};
export const loadAddAddressPage = async (req, res) => {

    try {

        const user =
        await User.findById(req.session.user.id);

        if (!user) {

            return res.redirect('/login');
        }

        res.render(
            'user/profile/add-address',
            { user }
        );

    } catch (error) {

        console.log(error);

        res.redirect('/pageNotFound');
    }
};
export const addAddress = async (req, res) => {

    try {

        const user =
        await User.findById(req.session.user.id);

        if (!user) {

            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        const {
            phone,
            streetAddress,
            city,
            state,
            pincode,
            country,
            isDefault
        } = req.body;

        if (
            !phone ||
            !streetAddress ||
            !city ||
            !state ||
            !pincode ||
            !country
        ) {

            return res.json({
                success: false,
                message: 'All fields are required'
            });
        }

        const phoneRegex = /^[0-9]{10}$/;

        if (!phoneRegex.test(phone)) {

            return res.json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

       const defaultValue = isDefault === 'on';

if (defaultValue) {

    await Address.updateMany(
        { userId: user._id },
        { $set: { isDefault: false } }
    );
}

const newAddress = new Address({

    userId: user._id,

    firstName: user.firstName,

    lastName: user.lastName,

    phoneNumber: phone,

    streetAddress,

    city,

    state,

    pincode,

    country,

    isDefault: defaultValue
});
        await newAddress.save();

        return res.json({
            success: true,
            message: 'Address added successfully',
            redirectUrl: '/profile/address'
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
};
export const loadAddressPage = async (req, res) => {

    try {

        const user =
        await User.findById(req.session.user.id);

        if (!user) {

            return res.redirect('/login');
        }

        const addresses =
        await Address.find({
            userId: user._id
        });

        res.render(
            'user/profile/address',
            {
                user,
                addresses
            }
        );

    } catch (error) {

        console.log(error);

        res.redirect('/pageNotFound');
    }
};
export const loadEditAddressPage = async (req, res) => {

    try {

        const user =
            await User.findById(req.session.user.id);

        const address =
            await Address.findById(req.params.id);

        if (!address) {

            return res.redirect('/profile/address');
        }

        res.render(
            'user/profile/edit-address',
            {
                user,
                address
            }
        );

    } catch (error) {

        console.log(error);

        res.redirect('/profile/address');
    }
};
export const updateAddress = async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            phoneNumber,
            streetAddress,
            city,
            state,
            pincode,
            country,
            isDefault
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !phoneNumber ||
            !streetAddress ||
            !city ||
            !state ||
            !pincode ||
            !country
        ) {

            return res.json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!/^\d{10}$/.test(phoneNumber)) {

            return res.json({
                success: false,
                message: 'Phone number must be 10 digits'
            });
        }

        const address =
            await Address.findById(req.params.id);

        if (!address) {

            return res.json({
                success: false,
                message: 'Address not found'
            });
        }

        if (isDefault === 'on') {

            await Address.updateMany(
                { userId: req.session.user.id },
                { $set: { isDefault: false } }
            );
        }

        address.firstName = firstName;
        address.lastName = lastName;
        address.phoneNumber = phoneNumber;
        address.streetAddress = streetAddress;
        address.city = city;
        address.state = state;
        address.pincode = pincode;
        address.country = country;
        address.isDefault = isDefault === 'on';

        await address.save();

        return res.json({
            success: true,
            message: 'Address updated successfully',
            redirectUrl: '/profile/address'
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
};
export const deleteAddress = async (req, res) => {

    try {

        const address = await Address.findById(req.params.id);

        if (!address) {

            return res.json({
                success: false,
                message: 'Address not found'
            });
        }

        await Address.findByIdAndDelete(req.params.id);

        return res.json({
            success: true,
            message: 'Address deleted successfully'
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: 'Something went wrong'
        });
    }
};