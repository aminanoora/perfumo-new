import Coupon from "../../models/Coupon.js";


export const getAvailableCoupons = async (userId) => {

    

  const now = new Date();
    const coupons = await Coupon.find({

        isActive: true,

        validFrom: { $lte: now },

        validUntil: { $gte: now },

        $or: [

            {
                usageLimit: 0
            },

            {
                $expr: {
                    $lt: ["$usedCount", "$usageLimit"]
                }
            }

        ],

        "usedBy.user": {

            $ne: userId

        }

    })

    .sort({

        validUntil: 1

    });

    return coupons;

};