import Address from "../../models/Address.js";
import Cart from "../../models/Cart.js";
import Coupon from "../../models/Coupon.js";
import Product from "../../models/Product.js";
import Variant from "../../models/Variant.js";
import Order from "../../models/Order.js";
import Wallet from "../../models/Wallet.js";

import Razorpay from "razorpay";
import crypto from "crypto";


const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_KEY_SECRET

});




export const loadCheckout = async (req,res)=>{

    try{

        const userId=req.session.user.id;

        const addresses=await Address.find({

           userId: userId
        });

        const cart=await Cart.findOne({

            user:userId

        })

        .populate({

            path:"items.variant",

            populate:{

                path:"product",

                populate:["brand","category"]

            }

        });

        if(!cart || cart.items.length===0){

            req.session.message={

                type:"warning",

                text:"Your cart is empty"

            };

            return res.redirect("/cart");

        }

        let subtotal = 0;

cart.items.forEach(item => {
    subtotal += item.variant.salePrice * item.quantity;
});

const shipping = subtotal > 999 ? 0 : 100;
const discount = 0;

const grandTotal = subtotal + shipping - discount;

        res.render("user/cart/checkout",{

  user: req.session.user,
    addresses,
    cart,
    subtotal,
    shipping,
    discount,
    grandTotal

        });

    }

    catch(error){

        console.log(error);

        res.redirect("/cart");

    }

};


export const applyCoupon=async(req,res)=>{

    try{

        const {code}=req.body;

        const coupon=await Coupon.findOne({

            code:code.toUpperCase(),

            isActive:true

        });

        if(!coupon){

            return res.json({

                success:false,

                message:"Invalid coupon"

            });

        }

        const userId=req.session.user.id;

        const cart=await Cart.findOne({

            user:userId

        })

        .populate("items.variant");

        let subtotal=0;

        cart.items.forEach(item=>{

            subtotal+=item.variant.salePrice*item.quantity;

        });

        let discount=0;

        if(coupon.discountType==="percentage"){

            discount=subtotal*coupon.discount/100;

        }

        else{

            discount=coupon.discount;

        }

        if(coupon.maxDiscount){

            discount=Math.min(discount,coupon.maxDiscount);

        }


        const shipping = subtotal > 999 ? 0 : 100;


        res.json({

            success: true,
    discount,
    total: subtotal + shipping - discount,
    message: "Coupon Applied"



        });

    }

    catch(error){

        console.log(error);

        res.json({

            success:false,

            message:"Unable to apply coupon"

        });

    }

};


export const placeOrder=async(req,res)=>{

    try{

        const userId=req.session.user.id;

        const {

            addressId,

            paymentMethod

        }=req.body;

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

        const address = await Address.findOne({
     _id: addressId,
    userId: userId
});

if (!address) {
    return res.redirect("/checkout");
}

for (const item of cart.items) {

    const variant = await Variant.findById(item.variant._id);

    if (!variant || variant.stock < item.quantity) {

        req.session.message = {
            type: "error",
            text: `${variant.product.name} is out of stock`
        };

        return res.redirect("/checkout");
    }
}

let subtotal = 0;

cart.items.forEach(item => {
    subtotal += item.variant.salePrice * item.quantity;
});

const shipping = subtotal > 999 ? 0 : 100;
const discount = 0;
const grandTotal = subtotal + shipping - discount;


const orderItems = cart.items.map(item => ({
    product: item.variant.product._id,
    variant: item.variant._id,
    quantity: item.quantity,
    price: item.variant.price,
    salePrice: item.variant.salePrice,
    total: item.variant.salePrice * item.quantity
}));

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

    grandTotal,

    paymentMethod,

    paymentStatus:
        paymentMethod === "COD" ? "Pending" : "Paid",

    orderStatus: "Pending"
});

        await order.save();

        await Cart.findOneAndDelete({

            user:userId

        });

        req.session.message={

            type:"success",

            text:"Order Placed Successfully"

        };

    res.redirect(`/checkout/order-success/${order._id}`);

    }

    catch(error){

        console.log(error);

        res.redirect("/checkout");

    }

};





export const createRazorpayOrder = async (req,res)=>{

    try{

        const cart = await Cart.findOne({
    user: req.session.user.id
}).populate("items.variant");

if (!cart || cart.items.length === 0) {
    return res.json({
        success: false,
        message: "Cart is empty"
    });
}

let subtotal = 0;

cart.items.forEach(item => {
    subtotal += item.variant.salePrice * item.quantity;
});

const shipping = subtotal > 999 ? 0 : 100;

const grandTotal = subtotal + shipping;

const options = {
    amount: grandTotal * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now()
};

        const order = await razorpay.orders.create(options);

        res.json({

            success:true,

            order

        });

    }

    catch(error){

        console.log(error);

        res.json({

            success:false

        });

    }

}





export const verifyPayment = async(req,res)=>{

    try{

        const{

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature

        }=req.body;

        const body=

            razorpay_order_id+"|"+razorpay_payment_id;

        const expected=

            crypto

            .createHmac(

                "sha256",

                process.env.RAZORPAY_KEY_SECRET

            )

            .update(body)

            .digest("hex");

        if(expected===razorpay_signature){

            return res.json({

                success:true

            });

        }

        res.json({

            success:false

        });

    }

    catch(error){

        console.log(error);

        res.json({

            success:false

        });

    }

}


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

