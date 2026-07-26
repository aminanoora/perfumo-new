import Coupon from "../../models/Coupon.js";

export const getCoupons = async (query) => {

    const page = Number(query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const search = query.search?.trim() || "";
    const status = query.status || "all";
    const sort = query.sort || "newest";

    const filter = {};

    await Coupon.updateMany(

{

validUntil:{

$lt:new Date()

},

isActive:true

},

{

$set:{

isActive:false

}

}

);

    if (search) {

        filter.$or = [

            {
                code: {
                    $regex: search,
                    $options: "i"
                }
            },

            {
                description: {
                    $regex: search,
                    $options: "i"
                }
            }

        ];

    }

    if(status==="active"){

filter.isActive=true;

filter.validUntil={

$gte:new Date()

};

}
if(status==="expired"){

filter.validUntil={

$lt:new Date()

};

}

    if (status === "inactive") {

        filter.isActive = false;

    }

    let sortOption = {};

    switch (sort) {

        case "oldest":

            sortOption = {
                createdAt: 1
            };

            break;

        case "a-z":

            sortOption = {
                code: 1
            };

            break;

        case "z-a":

            sortOption = {
                code: -1
            };

            break;

        case "expiry":

            sortOption = {
                validUntil: 1
            };

            break;

        case "discountHigh":

            sortOption = {
                discount: -1
            };

            break;

        case "discountLow":

            sortOption = {
                discount: 1
            };

            break;

        default:

            sortOption = {
                createdAt: -1
            };

    }

    const totalCoupons = await Coupon.countDocuments();

    const activeCoupons = await Coupon.countDocuments({

isActive:true,

validUntil:{

$gte:new Date()

}

});

const expiredCoupons = await Coupon.countDocuments({

validUntil:{

$lt:new Date()

}

});

const disabledCoupons = await Coupon.countDocuments({

isActive:false

});

const filteredCoupons = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)

        .sort(sortOption)

        .skip(skip)

        .limit(limit);

    return {

        coupons,

        currentPage: page,

       totalPages: Math.ceil(filteredCoupons / limit),

        totalCoupons,

       activeCoupons,

    expiredCoupons,

    disabledCoupons,

        search,

        status,

        sort

    };

};



export const createCoupon = async (data) => {

    const existing = await Coupon.findOne({

        code: data.code.toUpperCase()

    });

    if (existing) {

        throw new Error("Coupon code already exists");

    }

    const coupon = new Coupon({

           code: data.code.trim().toUpperCase(),

       description: data.description.trim(),

        discountType: data.discountType,

        discount: data.discount,

        minimumPurchase: data.minimumPurchase,

        maximumDiscount: data.maximumDiscount,

        usageLimit: data.usageLimit,

        validFrom: data.validFrom,

        validUntil: data.validUntil,

        isActive: data.isActive === "true"

    });

    return await coupon.save();

};



export const getCouponById = async (id) => {

    return await Coupon.findById(id);

};



export const updateCoupon = async (id, data) => {

    const duplicate = await Coupon.findOne({

        code: data.code.toUpperCase(),

        _id: {

            $ne: id

        }

    });

    if (duplicate) {

        throw new Error("Coupon code already exists");

    }

    return await Coupon.findByIdAndUpdate(

        id,

        {

           code: data.code.trim().toUpperCase(),

            description: data.description.trim(),

            discountType: data.discountType,

            discount: data.discount,

            minimumPurchase: data.minimumPurchase,

            maximumDiscount: data.maximumDiscount,

            usageLimit: data.usageLimit,

            validFrom: data.validFrom,

            validUntil: data.validUntil,

            isActive: data.isActive === "true"

        },

        {

            new: true,

            runValidators: true

        }

    );

};



export const toggleCouponStatus = async (id) => {

    const coupon = await Coupon.findById(id);

    if (!coupon) {

        throw new Error("Coupon not found");

    }

    coupon.isActive = !coupon.isActive;

    await coupon.save();

    return coupon;

};