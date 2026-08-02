import User from '../../models/User.js';

import Address from '../../models/Address.js';

import { sendOTP } from '../../services/mailService.js';

import bcrypt from 'bcrypt';


import Cart from "../../models/Cart.js";

import Order from "../../models/Order.js";

import Product from "../../models/Product.js";

import Variant from "../../models/Variant.js";

import Wallet from "../../models/Wallet.js";

import Referral from "../../models/Refferal.js";

import Coupon from "../../models/Coupon.js";

import * as profileService from "../../services/user/profileService.js";

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

          const nameRegex = /^[A-Za-z\s'-]+$/;

        if (!nameRegex.test(firstName.trim())) {
    return res.json({
        success: false,
        message: "First name should contain only letters"
    });
}

if (!nameRegex.test(lastName.trim())) {
    return res.json({
        success: false,
        message: "Last name should contain only letters"
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

        const user = await User.findById(req.session.user.id);

        if (!user) {
            return res.redirect("/login");
        }

        const returnTo = req.query.returnTo || "";

        res.render("user/profile/add-address", {
            user,
            returnTo
        });

    } catch (error) {

        console.log(error);

        res.redirect("/pageNotFound");

    }

};
export const addAddress = async (req, res) => {

    try {

        const user =
        await User.findById(req.session.user.id);


       const returnTo = req.body.returnTo;

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

      

const addressCount = await Address.countDocuments({
    userId: user._id
});

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

       const redirectUrl =
    returnTo === "checkout"
        ? "/checkout"
        : "/profile/address";

return res.json({
    success: true,
    message: "Address added successfully",
    redirectUrl
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

        const user = await User.findById(req.session.user.id);

        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.redirect("/profile/address");
        }

        const returnTo = req.query.returnTo || "";

        res.render("user/profile/edit-address", {
            user,
            address,
            returnTo
        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile/address");

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

        const returnTo = req.body.returnTo;

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

       const redirectUrl =
    returnTo === "checkout"
        ? "/checkout"
        : "/profile/address";

return res.json({
    success: true,
    message: "Address updated successfully",
    redirectUrl
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

        const defaultAddress = await Address.findOne({
    userId: req.session.user.id,
    isDefault: true
});

if (!defaultAddress) {

    const firstAddress = await Address.findOne({
        userId: req.session.user.id
    });

    if (firstAddress) {

        firstAddress.isDefault = true;

        await firstAddress.save();

    }

}

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

export const loadOrders = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const sort = req.query.sort || "newest";

        let sortOption = {};

        switch (sort) {

            case "oldest":
                sortOption = { createdAt: 1 };
                break;

            case "high":
                sortOption = { grandTotal: -1 };
                break;

            case "low":
                sortOption = { grandTotal: 1 };
                break;

            default:
                sortOption = { createdAt: -1 };

        }

        const orders = await Order.find({

            user: userId

        })

        .populate({
            path: "items.product"
        })

        .populate({
            path: "items.variant"
        })

        .sort(sortOption);

        res.render("user/profile/orders", {

            user: req.session.user,
            orders,
            sort

        });

    }

    catch (error) {

        console.log(error);

        res.redirect("/profile");

    }

};

export const loadOrderDetails = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const order = await Order.findOne({

            _id: req.params.id,

            user: userId

        })

        .populate("items.product")

        .populate("items.variant");

        if (!order) {

            req.session.message = {

                type: "error",

                text: "Order not found"

            };

            return res.redirect("/profile/orders");

        }

        const activeItems = order.items.filter(
    item =>
        item.itemStatus !== "Cancelled" &&
        item.itemStatus !== "Returned"
);

const canDownloadInvoice =
    activeItems.length > 0 &&
    activeItems.every(item =>
        [
            "Shipped",
            "Out For Delivery",
            "Delivered"
        ].includes(item.itemStatus)
    );

const hasCoupon = !!order.coupon;

const canReturnWholeOrder =
    !hasCoupon &&
    activeItems.length > 0 &&
    activeItems.every(
        item => item.itemStatus === "Delivered"
    );

        console.log("=== ORDER SENT TO EJS ===");
console.log(order._id.toString());

console.log(JSON.stringify(order.items, null, 2));


console.log(
    "Before render:",
    order.items[0]._id.toString()
);

console.log(
    order.items.map(i => ({
        id: i._id.toString(),
        status: i.itemStatus
    }))
);


        res.render("user/profile/order-details", {

            user: req.session.user,

            order,


    hasCoupon: !!order.coupon,
     canDownloadInvoice,
    canReturnWholeOrder

        });

    }

    catch (error) {

        console.log(error);
         console.error("loadOrderDetails ERROR:");
    console.error(error.stack);

        res.redirect("/profile/orders");

    }

};


export const cancelItem = async (req, res) => {

    try {

      const { orderId, variantId } = req.params;
        const { reason } = req.body;

      

        const order = await Order.findOne({
            _id: orderId,
            user: req.session.user.id
        }).populate("items.variant");

        if (!order) {

            return res.json({
                success: false,
                message: "Order not found"
            });

        }

    const item = order.items.find(
    i => i.variant && i.variant._id.toString() === variantId
);

        if (!item) {

            return res.json({
                success: false,
                message: "Item not found"
            });

        }

        let refundAmount = item.finalPricePaid;

        if (
            ![
                "Pending",
                "Confirmed",
                "Processing"
            ].includes(item.itemStatus)
        ) {

            return res.json({
                success: false,
                message: "This item cannot be cancelled"
            });

        }

        item.itemStatus = "Cancelled";
        item.cancelReason = reason || "";
        item.cancelledAt = new Date();

      
     const variant = await Variant.findById(item.variant);

        if (variant) {

            variant.stock += item.quantity;

            await variant.save();

        }

       if (
    order.paymentMethod !== "COD" &&
    order.paymentStatus === "Paid"
) { 

    if(order.coupon){

    const coupon = await Coupon.findById(order.coupon);


    if(coupon){

        const remainingItems = order.items.filter(
            i =>
            i._id.toString() !== item._id.toString() &&
            i.itemStatus !== "Cancelled"
        );


      const remainingTotal = remainingItems.reduce(
    (sum,i)=>
    sum + (i.originalPrice * i.quantity),
    0
);



       if (remainingTotal < coupon.minimumPurchase) {

    const clawback = remainingItems.reduce(
        (sum, i) => sum + i.allocatedCouponDiscount,
        0
    );

    refundAmount = Math.max(
        0,
        item.finalPricePaid - clawback
    );

  
    order.coupon = null;
    order.discount = 0;

  
    coupon.usedCount = Math.max(0, coupon.usedCount - 1);

   coupon.usedBy = coupon.usedBy.filter(
    u => u.user.toString() !== order.user.toString()
);
    await coupon.save();

}

    }

}
            let wallet = await Wallet.findOne({
                user: order.user
            });

            if (!wallet) {

                wallet = await Wallet.create({
                    user: order.user,
                    balance: 0,
                    transactions: []
                });

            }

        refundAmount = Math.max(
    0,
    refundAmount
);



wallet.balance += refundAmount;

wallet.transactions.push({
    type: "credit",
    amount: refundAmount,
    reason: "Order Cancelled",
    order: order._id,
    description: `Refund for cancelled item`
});
            await wallet.save();

        }

 
       
 const activeItems = order.items.filter(
    i =>
        i.itemStatus !== "Cancelled" &&
        i.itemStatus !== "Returned"
);

order.subtotal = activeItems.reduce(
    (sum, item) =>
        sum + item.finalPricePaid,
    0
);

if (order.coupon) {

    order.discount = activeItems.reduce(
        (sum, item) =>
            sum + item.allocatedCouponDiscount,
        0
    );

} else {

    order.discount = 0;

}

order.shippingCharge =
    order.subtotal >= 999
        ? 0
        : 100;

order.grandTotal =
    order.subtotal
    - order.discount
    + order.shippingCharge
    + order.tax;
      

     

     const allCancelled = order.items.every(
    i => i.itemStatus === "Cancelled"
);



if (allCancelled) {

  const activeCount = activeItems.length;

if (activeCount === 0) {

    order.orderStatus = "Cancelled";

}
else{

    order.orderStatus = "Partially Cancelled";

}

    if (order.paymentMethod !== "COD") {
        order.paymentStatus = "Refunded";
    }

} else {

    order.orderStatus = "Partially Cancelled";

    if (order.paymentMethod !== "COD") {
        order.paymentStatus = "Partially Refunded";
    }

}

  await order.save();

        return res.json({

            success: true,

            message: "Item cancelled successfully"

        });

    }
    catch (error) {

        console.log(error);

        return res.json({

            success: false,

            message: "Something went wrong"

        });

    }

};
export const returnItem = async (req, res) => {

    try {

        const { orderId, variantId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            user: req.session.user.id
        })
        .populate("items.product")
        .populate("items.variant");

        if (!order) {

            return res.json({
                success:false,
                message:"Order not found"
            });

        }

        const item = order.items.find(
            i =>
                i.variant &&
                i.variant._id.toString() === variantId
        );

        if (!item) {

            return res.json({
                success:false,
                message:"Item not found"
            });

        }
       

        if (item.itemStatus !== "Delivered") {

            return res.json({
                success:false,
                message:"Return not allowed"
            });

        }

        if (item.returnStatus === "Requested") {

            return res.json({
                success:false,
                message:"Return already requested."
            });

        }

        item.returnStatus = "Requested";

        item.returnedReason = reason || "";

        await order.save();

        return res.json({

            success:true,

            message:"Return request submitted successfully."

        });

    }

    catch(error){

        console.log(error);

        return res.json({

            success:false,

            message:"Something went wrong"

        });

    }

};






export const buyAgain = async (req, res) => {

    try {

        const order = await Order.findOne({

            _id: req.params.id,

            user: req.session.user.id

        });

        if (!order) {

            return res.json({

                success: false,

                message: "Order not found"

            });

        }

        let cart = await Cart.findOne({

            user: req.session.user.id

        });

        if (!cart) {

            cart = await Cart.create({

                user: req.session.user.id,

                items: []

            });

        }

        for (const item of order.items) {

         if (
    item.itemStatus === "Cancelled" ||
    item.itemStatus === "Returned"
){
    continue;
}

            const existingItem = cart.items.find(

                cartItem =>
                    cartItem.variant.toString() === item.variant.toString()

            );

            if (existingItem) {

                existingItem.quantity += item.quantity;

            } else {

                cart.items.push({

                    product: item.product,

                    variant: item.variant,

                    quantity: item.quantity

                });

            }

        }

        await cart.save();

        return res.json({

            success: true,

            message: "Products added to cart"

        });

    }

    catch (error) {

        console.log(error);

        return res.json({

            success: false,

            message: "Something went wrong"

        });

    }

};

export const cancelWholeOrder = async (req, res) => {

    try {

        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            user: req.session.user.id
        }).populate("coupon");

        if (!order) {
            return res.json({
                success: false,
                message: "Order not found"
            });
        }

        if (!["Pending", "Confirmed", "Processing"].includes(order.orderStatus)) {
            return res.json({
                success: false,
                message: "Order cannot be cancelled"
            });
        }

        for (const item of order.items) {

            const variant = await Variant.findById(item.variant);

            if (variant) {
                variant.stock += item.quantity;
                await variant.save();
            }

            item.itemStatus = "Cancelled";
            item.cancelledAt = new Date();
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();

        if (order.paymentMethod !== "COD") {

            order.paymentStatus = "Refunded";

            let wallet = await Wallet.findOne({
                user: order.user
            });

            if (!wallet) {

                wallet = await Wallet.create({
                    user: order.user,
                    balance: 0,
                    transactions: []
                });

            }

          const refundAmount = order.items.reduce(
    (sum, item) => sum + item.finalPricePaid,
    0
) + order.shippingCharge;

wallet.balance += refundAmount;

            wallet.transactions.push({
    type: "credit",
    amount: refundAmount,
    reason: "Order Cancelled",
    order: order._id,
    description: "Refund for whole order cancellation"
});

            await wallet.save();
        }

        if (order.coupon) {

            await Coupon.findByIdAndUpdate(
                order.coupon._id,
                {
                    $inc: {
                        usedCount: -1
                    },
                    $pull: {
                        usedBy: {
                            user: order.user
                        }
                    }
                }
            );
        }

        await order.save();

        return res.json({
            success: true,
            message: "Order cancelled successfully"
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: "Something went wrong"
        });

    }

};

export const returnWholeOrder = async (req, res) => {

    try {

        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            user: req.session.user.id
        });

        if (!order) {

            return res.json({
                success: false,
                message: "Order not found"
            });

        }

        if (order.orderStatus !== "Delivered") {

            return res.json({
                success: false,
                message: "Return not allowed"
            });

        }

        const alreadyRequested =
order.items.every(
item=>item.returnStatus==="Requested"
);

if(alreadyRequested){

return res.json({
success:false,
message:"Return request already submitted."
});

}


        if (order.orderStatus === "Returned") {

            return res.json({
                success: false,
                message: "Order already returned"
            });

        }

        if (!reason || !reason.trim()) {

            return res.json({
                success: false,
                message: "Return reason is required"
            });

        }

        for (const item of order.items) {

            item.returnStatus = "Requested";
            item.returnedReason = reason;
            item.returnRequestedAt = new Date();

        }

        
        order.returnedReason = reason;
    
        order.returnStatus = "Requested";
order.returnedReason = reason;

        await order.save();

        return res.json({
            success: true,
            message: "Return request submitted successfully"
        });

    } catch (error) {

        console.log(error);

        return res.json({
            success: false,
            message: "Something went wrong"
        });

    }

};




export const downloadInvoice = async (req, res) => {

    try {

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        })
        .populate("items.product")
        .populate("items.variant");

        if (!order) {
            return res.redirect("/profile/orders");
        }

        const invoiceItems = order.items.filter(item =>
            item.itemStatus !== "Cancelled" &&
            item.itemStatus !== "Returned"
        );

        const subtotal = invoiceItems.reduce(
            (sum, item) => sum + item.total,
            0
        );

        const grandTotal =
            subtotal -
            order.discount +
            order.shippingCharge +
            order.tax;

        res.render("user/profile/order-document", {

            user: req.session.user,

            order,

            documentType: "invoice",

            items: invoiceItems,

            subtotal,

            grandTotal

        });

    } catch (err) {

        console.log(err);

    }

};


export const searchOrders = async (req, res) => {

    try {

        const keyword = req.query.keyword || "";

        const orders = await Order.find({

            user: req.session.user.id,

            orderId: {

                $regex: keyword,

                $options: "i"

            }

        })

        .populate("items.product")

        .populate("items.variant")

        .sort({

            createdAt: -1

        });

        res.render("user/profile/orders", {

            user: req.session.user,

            orders,

            sort: "newest"

        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile/orders");

    }

};

export const downloadOrderSummary = async (req,res)=>{

    try{

        const order = await Order.findOne({

            _id:req.params.id,

            user:req.session.user.id

        })

        .populate("items.product")

        .populate("items.variant");

        if(!order){

            return res.redirect("/profile/orders");

        }

        const subtotal = order.items.reduce(

            (sum,item)=>sum+item.total,

            0

        );

        res.render("user/profile/order-document",{

            user:req.session.user,

            order,

            documentType:"summary",

            items:order.items,

            subtotal,

            grandTotal:order.grandTotal

        });

    }

    catch(err){

        console.log(err);

    }

}

export const loadWallet = async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = 10;

        const wallet = await Wallet.findOne({

            user: req.session.user.id

        });

        if (!wallet) {

            return res.render("user/profile/wallet", {

                user: req.session.user,

                wallet: {

                    balance: 0,

                    transactions: []

                },

                currentPage: 1,

                totalPages: 1

            });

        }

        wallet.transactions.sort(

            (a, b) => b.createdAt - a.createdAt

        );

        const totalTransactions = wallet.transactions.length;

        const totalPages = Math.ceil(totalTransactions / limit);

        const transactions = wallet.transactions.slice(

            (page - 1) * limit,

            page * limit

        );

        res.render("user/profile/wallet", {

            user: req.session.user,

            wallet: {

                balance: wallet.balance,

                transactions

            },

            currentPage: page,

            totalPages

           

        });

    }

    catch (error) {

        console.log(error);

        res.redirect("/profile");

    }

};

export const loadReferralPage = async (req, res) => {

    try {

        const userId = req.session.user.id;

        const user = await User.findById(userId);

        const wallet = await Wallet.findOne({
            user: userId
        });
        const referralLink =
`${req.protocol}://${req.get("host")}/signup?ref=${user.referralCode}`;

        const referrals = await Referral.find({
            referrer: userId
        }).populate(
            "referredUser",
            "firstName lastName email createdAt"
        );

        const message = req.session.message;
        delete req.session.message;

        res.render("user/profile/refferal", {
            user,
            wallet,
            referrals,
            referralCount: referrals.length,
            totalRewards: referrals.length * 50,
            message,
           referralLink 
        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile");

    }

};
export const applyReferralCode = async (req,res)=>{

try{

const userId=req.session.user.id;

const { referralCode }=req.body;

const user=await User.findById(userId);

if(user.isReferralApplied){

return res.json({

success:false,

message:"Referral already applied."

});

}

if(user.referralCode===referralCode){

return res.json({

success:false,

message:"You cannot use your own referral code."

});

}

const referrer=await User.findOne({

referralCode

});

if(!referrer){

return res.json({

success:false,

message:"Invalid referral code."

});

}

const alreadyExists=await Referral.findOne({

referredUser:userId

});

if(alreadyExists){

return res.json({

success:false,

message:"Referral already used."

});

}

let referrerWallet=await Wallet.findOne({

user:referrer._id

});

if(!referrerWallet){

referrerWallet=new Wallet({

user:referrer._id

});

}

let userWallet=await Wallet.findOne({

user:userId

});

if(!userWallet){

userWallet=new Wallet({

user:userId

});

}

referrerWallet.balance+=50;

referrerWallet.transactions.push({

type:"credit",

amount:50,

reason:"Referral Bonus",

description:`Referral bonus for inviting ${user.firstName}`

});

userWallet.balance+=50;

userWallet.transactions.push({

type:"credit",

amount:50,

reason:"Referral Bonus",

description:`Referral signup reward`

});

await referrerWallet.save();

await userWallet.save();

user.referredBy=referrer._id;

user.isReferralApplied=true;

await user.save();

await Referral.create({

referrer:referrer._id,

referredUser:userId,

referralCode,

rewardAmount:50

});

return res.json({

success:true,

message:"Referral applied successfully. ₹50 added to your wallet."

});

}

catch(error){

console.log(error);

return res.json({

success:false,

message:"Something went wrong."

});

}

}
export const loadCoupons = async (req, res) => {

    try {

        const userId =req.session.user.id;

        const coupons = await profileService.getAvailableCoupons(userId);

        res.render("user/profile/coupons", {

            coupons,
            active: "coupons"

        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile");

    }

};