import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    price: Number,

    salePrice: Number,

    originalPrice: {
    type: Number,
    default: 0
},

allocatedCouponDiscount: {
    type: Number,
    default: 0
},

finalPricePaid: {
    type: Number,
    default: 0
},

    total: Number,

    itemStatus: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Out For Delivery",
            "Delivered",
            "Cancelled",
            "Returned"
        ],
        default: "Pending"
    },

   
    returnStatus: {
        type: String,
        enum: [
            "None",
            "Requested",
            "Approved",
            "Rejected"
        ],
        default: "None"
    },

    returnRejectedReason: {
        type: String,
        default: ""
    },

    cancelReason: String,

    cancelledAt: Date,

    returnedReason: String,

    returnedAt: Date,

    deliveredAt: Date

});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      mobile: String,
      house: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String
    },

    subtotal: {
      type: Number,
      required: true
    },

    discount: {
      type: Number,
      default: 0
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },

    shippingCharge: {
      type: Number,
      default: 0
    },

    tax: {
      type: Number,
      default: 0
    },

    grandTotal: {
      type: Number,
      required: true
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY", "WALLET"],
      required: true
    },

    paymentStatus: {
    type: String,
    enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refund Pending",
        "Refunded",
        "Partially Refunded"
    ],
    default: "Pending"
},

    orderStatus: {
      type: String,
      enum:[
    "Pending",
    "Confirmed",
    "Processing",
    "Partially Cancelled",
    "Partially Returned",
    "Shipped",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
    "Returned"
],
      default: "Pending"
    },

    razorpayOrderId: String,

    razorpayPaymentId: String,

    razorpaySignature: String,

    cancelReason: String,

  returnStatus: {
    type: String,
    enum: [
        "None",
        "Requested",
        "Approved",
        "Rejected"
    ],
    default: "None"
},

returnedReason: String,

returnRejectedReason: {
    type: String,
    default: ""
},
    deliveredAt: Date,

    cancelledAt: Date,

    returnedAt: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);