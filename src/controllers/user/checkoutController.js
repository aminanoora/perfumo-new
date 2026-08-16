import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Coupon from "../../models/Coupon.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Order from "../../models/Order.js";
import Wallet from "../../models/Wallet.js";

import Razorpay from "razorpay";
import crypto from "crypto";

import { validateCartItems } from "../../util/orderValidation.js";
import * as profileService from "../../services/user/profileService.js";



const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_KEY_SECRET

});




export const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const retryOrder = req.query.retryOrder || null;

        const wallet = await Wallet.findOne({ user: userId });

        const addresses = await Address.find({
            userId: userId
        });

        let cart = null;
        let subtotal = 0;
        let shipping = 0;
        let discount = 0;
        let grandTotal = 0;
        let coupons = [];

        coupons = await profileService.getAvailableCoupons(userId);

        if (retryOrder) {

            const order = await Order.findOne({
                _id: retryOrder,
                user: userId,
                paymentStatus: "Pending"
            })
            .populate({
                path: "items.variant",
                populate: {
                    path: "product",
                    populate: ["brand", "category"]
                }
            });

            if (!order) {
                req.session.message = {
                    type: "error",
                    text: "Order not found"
                };

                return res.redirect("/profile/orders");
            }

            cart = {
                items: order.items
            };

            subtotal = order.subtotal;
            shipping = order.shippingCharge;
            discount = 0;

            grandTotal = subtotal + shipping;

            delete req.session.coupon;

        } else {

            cart = await Cart.findOne({
                user: userId
            })
            .populate({
                path: "items.variant",
                populate: {
                    path: "product",
                    populate: ["brand", "category"]
                }
            });

            if (!cart || cart.items.length === 0) {
                req.session.message = {
                    type: "warning",
                    text: "Your cart is empty"
                };

                return res.redirect("/cart");
            }

            const validation = await validateCartItems(cart.items);

            if (!validation.valid) {
                req.session.message = {
                    type: "error",
                    text: validation.message
                };

                return res.redirect("/cart");
            }

            cart.items.forEach(item => {
                subtotal += item.variant.salePrice * item.quantity;
            });

            shipping = subtotal > 999 ? 0 : 100;

            discount = req.session.coupon?.discount || 0;

            grandTotal = subtotal + shipping - discount;
        }

        const message = req.session.message;
        delete req.session.message;

        res.render("user/cart/checkout", {
            user: req.session.user,
            addresses,
            cart,
            subtotal,
            shipping,
            discount,
            grandTotal,
            wallet,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            retryOrder,
            coupons,
            message
        });

    } catch (error) {
        console.log("loadCheckout ERROR:", error);
        res.redirect("/cart");
    }
};


export const applyCoupon = async (req, res) => {
    try {
        const { code, retryOrder } = req.body;
        const userId = req.session.user.id;

        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.json({
                success: false,
                message: "Invalid coupon"
            });
        }

        const now = new Date();

        const validUntil = new Date(coupon.validUntil);
        validUntil.setHours(23, 59, 59, 999);

        if (
            now < coupon.validFrom ||
            now > validUntil
        ) {
            return res.json({
                success: false,
                message: "Coupon expired."
            });
        }

        const alreadyUsed = coupon.usedBy.some(
            item =>
                item.user.toString() === userId.toString()
        );

        if (alreadyUsed) {
            return res.json({
                success: false,
                message: "You have already used this coupon."
            });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.json({
                success: false,
                message: "Coupon usage limit reached."
            });
        }

        let subtotal = 0;

        if (retryOrder) {

            const order = await Order.findOne({
                _id: retryOrder,
                user: userId,
                paymentStatus: "Pending"
            });

            if (!order) {
                return res.json({
                    success: false,
                    message: "Retry order not found"
                });
            }

            subtotal = order.items.reduce(
                (sum, item) =>
                    sum + item.salePrice * item.quantity,
                0
            );

        } else {

            const cart = await Cart.findOne({
                user: userId
            }).populate("items.variant");

            if (!cart || !cart.items.length) {
                return res.json({
                    success: false,
                    message: "Cart is empty"
                });
            }

            subtotal = cart.items.reduce(
                (sum, item) =>
                    sum + item.variant.salePrice * item.quantity,
                0
            );
        }

        if (subtotal < coupon.minimumPurchase) {
            return res.json({
                success: false,
                message: `Minimum purchase ₹${coupon.minimumPurchase}`
            });
        }

        let discount = 0;

        if (coupon.discountType === "percentage") {
            discount =
                subtotal * coupon.discount / 100;
        } else {
            discount = coupon.discount;
        }

        if (coupon.maximumDiscount) {
            discount = Math.min(
                discount,
                coupon.maximumDiscount
            );
        }

        const shipping =
            subtotal > 999 ? 0 : 100;

        const total =
            subtotal +
            shipping -
            discount;

        req.session.coupon = {
            couponId: coupon._id,
            code: coupon.code,
            discount
        };

        res.json({
            success: true,
            discount,
            total,
            message: "Coupon Applied"
        });

    } catch (error) {
        console.log("applyCoupon ERROR:", error);

        res.json({
            success: false,
            message: "Unable to apply coupon"
        });
    }
};


export const removeCoupon = async (req, res) => {

    try {

   
        req.session.coupon = null;

        const userId = req.session.user.id;

        const cart = await Cart.findOne({
            user: userId
        })
        .populate("items.variant");

        if (!cart) {

            return res.json({
                success: false,
                message: "Cart not found"
            });

        }

        const subtotal = cart.items.reduce(
            (sum, item) =>
                sum +
                Number(item.variant.salePrice || 0) *
                Number(item.quantity || 0),
            0
        );

        const shipping =
            subtotal >= 999
                ? 0
                : 100;

       
        const tax = 0;

        const discount = 0;

        const total =
            subtotal -
            discount +
            shipping +
            tax;

        return res.json({

            success: true,

            message:
                "Coupon removed successfully",

            discount: 0,

            total

        });

    } catch (error) {

        console.log(
            "removeCoupon ERROR:",
            error
        );

        return res.json({

            success: false,

            message:
                "Unable to remove coupon"

        });

    }

};

export const placeOrder=async(req,res)=>{

    try{

        const userId=req.session.user.id;

       const {

    addressId,

    paymentMethod

   
} = req.body;

if (paymentMethod === "RAZORPAY") {

    return res.status(400).json({
        success:false
    });

}

        const cart=await Cart.findOne({

            user:userId

        })

        .populate({
    path: "items.variant",
    populate: {
        path: "product"
    }
});
        if(!cart){

            console.log("Cart not found")
            return res.redirect("/cart");

        }

          let subtotal = 0;

cart.items.forEach(item => {
    subtotal += item.variant.salePrice * item.quantity;
});


        const shipping = subtotal > 999 ? 0 : 100;
const appliedCoupon = req.session.coupon;

const discount = appliedCoupon?.discount || 0;

const grandTotal = subtotal + shipping - discount;

        const address = await Address.findOne({
     _id: addressId,
    userId: userId
});

if (!address) {
    console.log("Address not found")
    return res.redirect("/checkout");
}

const validation = await validateCartItems(cart.items);


if (!validation.valid) {

    req.session.message = {
        type: "error",
        text: validation.message
    };

    console.log("balidation error :",validation.message)

    return res.redirect("/checkout");

}

const updatedVariants = [];

for (const item of cart.items) {

    const updatedVariant = await Variant.findOneAndUpdate(

        {
            _id: item.variant._id,
            stock: { $gte: item.quantity }
        },

        {
            $inc: {
                stock: -item.quantity
            }
        },

        {
            new: true
        }

    );

    if (!updatedVariant) {

        req.session.message = {
            type: "error",
            text: `${item.variant.product.name} is out of stock`
        };

        return res.redirect("/checkout");
    }

    updatedVariants.push({
        variantId: item.variant._id,
        quantity: item.quantity
    });

}



let paymentStatus = "Pending";
let wallet = null;

if (paymentMethod === "WALLET") {

    wallet = await Wallet.findOne({ user: userId });

    if (!wallet || wallet.balance < grandTotal) {

        req.session.message = {
            type: "error",
            text: "Insufficient wallet balance"
        };

        return res.redirect("/checkout");
    }

    paymentStatus = "Paid";
}

if (paymentMethod === "COD") {
    paymentStatus = "Pending";
}




const orderItems = cart.items.map(item => {

    const originalPrice =
        item.variant.price * item.quantity;

    const salePrice =
        item.variant.salePrice * item.quantity;

    let allocatedCouponDiscount = 0;

    if (appliedCoupon && subtotal > 0) {

        allocatedCouponDiscount =
            (salePrice / subtotal) * discount;

    }

    const finalPricePaid =
        salePrice - allocatedCouponDiscount;

    return {

        product: item.variant.product._id,

        variant: item.variant._id,

        quantity: item.quantity,

        price: item.variant.price,

        salePrice: item.variant.salePrice,

        originalPrice,

        allocatedCouponDiscount,

        finalPricePaid,

        total: finalPricePaid

    };

});

        const order = new Order({
    orderId: "ORD" + Date.now(),

    user: userId,

    items: orderItems,

    shippingAddress: {
        fullName: `${address.firstName} ${address.lastName}`,
        mobile: address.phoneNumber,
        house: address.houseName || "",
        street: address.streetAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark || ""
    },

    subtotal,

    shippingCharge: shipping,

    discount,

       coupon: appliedCoupon?.couponId,

    grandTotal,

     paymentMethod,
    paymentStatus,
    orderStatus: "Pending"
});

        await order.save();

      if (paymentMethod === "WALLET") {

    wallet.balance -= grandTotal;

    wallet.transactions.push({
        type: "debit",
        amount: grandTotal,
        reason: "Order Payment",
        order: order._id,
        description: `Payment for ${order.orderId}`
    });

    await wallet.save();
}
       

        if(appliedCoupon){

    await Coupon.findByIdAndUpdate(

        appliedCoupon.couponId,

        {

            $inc:{

                usedCount:1

            },

            $push:{

                usedBy:{

                    user:userId,

                    usedAt:new Date()

                }

            }

        }

    );

}

await Cart.findOneAndDelete({

    user:userId

});

delete req.session.coupon;

        req.session.message={

            type:"success",

            text:"Order Placed Successfully"

        };

    res.redirect(`/checkout/order-success/${order._id}`);

    }

    catch(error){
for (const item of updatedVariants) {

    await Variant.findByIdAndUpdate(

        item.variantId,

        {
            $inc: {
                stock: item.quantity
            }
        }

    );

}


        console.log(error);

        res.redirect("/checkout");

    }

};

export const createPendingOrder = async (req,res)=>{

    try{

        const userId = req.session.user.id;

        const { addressId } = req.body;



        const cart=await Cart.findOne({

            user:userId

        })

        .populate({
    path: "items.variant",
    populate: {
        path: "product"
    }
});

  if(!cart){

            return res.redirect("/cart");

        }

     

const validation = await validateCartItems(cart.items);


if (!validation.valid) {

    req.session.message = {
        type: "error",
        text: validation.message
    };

    return res.redirect("/checkout");

}


        const address = await Address.findOne({
     _id: addressId,
    userId: userId
});

if (!address) {
    return res.redirect("/checkout");
}

let subtotal = 0;

cart.items.forEach(item => {
    subtotal += item.variant.salePrice * item.quantity;
});


const shipping = subtotal > 999 ? 0 : 100;
const appliedCoupon = req.session.coupon;

const discount = appliedCoupon?.discount || 0;

const grandTotal = subtotal + shipping - discount;


const orderItems = cart.items.map(item => {

    const originalPrice =
        item.variant.price * item.quantity;

    const salePrice =
        item.variant.salePrice * item.quantity;

    let allocatedCouponDiscount = 0;

    if (appliedCoupon && subtotal > 0) {

        allocatedCouponDiscount =
            (salePrice / subtotal) * discount;

    }

    const finalPricePaid =
        salePrice - allocatedCouponDiscount;

    return {

        product: item.variant.product._id,

        variant: item.variant._id,

        quantity: item.quantity,

        price: item.variant.price,

        salePrice: item.variant.salePrice,

        originalPrice,

        allocatedCouponDiscount,

        finalPricePaid,

        total: finalPricePaid

    };

});
        const order = new Order({
    orderId: "ORD" + Date.now(),

    user: userId,

    items: orderItems,

    shippingAddress: {
        fullName: `${address.firstName} ${address.lastName}`,
        mobile: address.phoneNumber,
        house: address.houseName || "",
        street: address.streetAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark || ""
    },

    subtotal,

    shippingCharge: shipping,

    discount,

     coupon: appliedCoupon?.couponId,

    grandTotal,

    paymentMethod: "RAZORPAY",
   paymentStatus: "Pending",
    orderStatus: "Pending"
});

        await order.save();

       

    res.json({

    success:true,

    orderId:order._id,

    grandTotal

});

    }

    catch(error){

        console.log(error);

        res.redirect("/checkout");

    }

}



export const createRazorpayOrder = async (req,res)=>{

    try{

        const { orderId } = req.body;


   

const order = await Order.findById(orderId);

  if(!order){

    return res.json({

        success:false

    });

}

order.grandTotal


       const razorpayOrder = await razorpay.orders.create({

    amount:order.grandTotal*100,

    currency:"INR",

    receipt:order.orderId

});

order.razorpayOrderId = razorpayOrder.id;

await order.save();

res.json({

    success:true,

    razorpayOrder,

    mongoOrderId:order._id

});

    }

    catch(error){

        console.log(error);

        res.json({

            success:false

        });

    }

}





export const verifyPayment = async (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            mongoOrderId
        } = req.body;

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {

            return res.json({
                success: false
            });

        }

        const order = await Order.findById(mongoOrderId);

        if (!order) {

            return res.json({
                success: false
            });

        }

        order.paymentStatus = "Paid";
        order.paymentId = razorpay_payment_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.orderStatus = "Pending";

        await order.save();

     for (const item of order.items) {

    const updatedVariant = await Variant.findOneAndUpdate(

        {
            _id: item.variant,
            stock: { $gte: item.quantity }
        },

        {
            $inc: {
                stock: -item.quantity
            }
        },
        {
    returnDocument: "after"
}

    );

    if (!updatedVariant) {

        return res.json({

            success: false,
            message: "One or more products are out of stock."

        });

    }

}



        if (order.coupon) {

    await Coupon.findByIdAndUpdate(
        order.coupon,
        {
            $inc: { usedCount: 1 },
            $push: {
                usedBy: {
                    user: order.user,
                    usedAt: new Date()
                }
            }
        }
    );

}

       await Cart.findOneAndDelete({
    user: order.user
});

if (req.session.coupon) {
    delete req.session.coupon;
}

        res.json({
            success: true,
            orderId: order._id
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false
        });

    }

};


export const applyReferral=async(req,res)=>{

    try{

        const{code}=req.body;

        res.json({

            success:true,

            message:"Referral Applied"

        });

    }

    catch(error){

        res.json({

            success:false

        });

    }

};




export const loadOrderSuccess = async (req, res) => {

    try {

        const order = await Order.findById(req.params.orderId);

        if (!order) {

            req.session.message = {
                type: "error",
                text: "Order not found"
            };

            return res.redirect("/profile/orders");
        }

        res.render("user/cart/order-success", {

            user: req.session.user,
            order

        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile/orders");

    }

};

export const loadPaymentFailed = async (req, res) => {

    try {

        const order = await Order.findOne({

            _id: req.params.orderId,

            user: req.session.user.id

        });

        if (!order) {

            req.session.message = {

                type: "error",

                text: "Order not found."

            };

            return res.redirect("/profile/orders");

        }

        res.render("user/cart/payment-failed", {

            user: req.session.user,

            order,

            reason: "The payment was unsuccessful. You can retry your payment."

        });

    }

    catch (error) {

        console.log(error);

        res.redirect("/profile/orders");

    }

};

export const retryPayment = async (req, res) => {

    try {

        const order = await Order.findOne({

            _id: req.params.orderId,

            user: req.session.user.id

        });

        if (!order) {

            req.session.message = {

                type: "error",

                text: "Order not found."

            };

            return res.redirect("/profile/orders");

        }

   

       

         return res.redirect(`/checkout?retryOrder=${order._id}`);


    }

    catch (error) {

        console.log(error);

        res.redirect("/profile/orders");

    }

};