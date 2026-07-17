import Order from "../../models/Order.js";
import User from "../../models/User.js";



const statusFlow = {
    Pending: ["Confirmed", "Cancelled"],

    Confirmed: ["Processing", "Cancelled"],

    Processing: ["Shipped", "Cancelled"],

    Shipped: ["Out For Delivery"],

    "Out For Delivery": ["Delivered"],

    Delivered: [],

    Cancelled: [],

    Returned: [],

    "Partially Cancelled": [
        "Processing",
        "Shipped",
        "Out For Delivery",
        "Delivered"
    ],

    "Partially Returned": []
};


export const loadOrders = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const search = req.query.search || "";

        const status = req.query.status || "";

        const sort = req.query.sort || "newest";

        const dateRange = req.query.dateRange || "";

        let query = {};

        const payment = req.query.payment || "";

        if (status) {

            query.orderStatus = status;

        }

        if (payment) {
    query.paymentStatus = payment;
}

const today = new Date();

if (dateRange === "today") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    query.createdAt = { $gte: start, $lte: end };
}

if (dateRange === "week") {
    const start = new Date();
    start.setDate(today.getDate() - 7);

    query.createdAt = { $gte: start };
}

if (dateRange === "month") {
    const start = new Date();
    start.setMonth(today.getMonth() - 1);

    query.createdAt = { $gte: start };
}

if (dateRange === "year") {
    const start = new Date();
    start.setFullYear(today.getFullYear() - 1);

    query.createdAt = { $gte: start };
}

        let orders = await Order.find(query)

            .populate({
                path: "user",
                select: "firstName lastName email phone"
            })

            .sort({
                createdAt:
                    sort === "oldest" ? 1 : -1
            });

        if (search.trim() !== "") {

            const keyword = search.toLowerCase();

            orders = orders.filter(order => {

                const customer = order.user;

                const fullName =
                    `${customer?.firstName || ""} ${customer?.lastName || ""}`.toLowerCase();

                return (

                    order.orderId.toLowerCase().includes(keyword) ||

                    fullName.includes(keyword) ||

                    customer?.email?.toLowerCase().includes(keyword) ||

                    customer?.phone?.includes(keyword)

                );

            });

        }

        const totalOrders = orders.length;

        const totalPages = Math.ceil(totalOrders / limit);

        const paginatedOrders = orders.slice(skip, skip + limit);
      const start = new Date();
start.setHours(0, 0, 0, 0);

const end = new Date();
end.setHours(23, 59, 59, 999);

const stats = {
    total: await Order.countDocuments(),

    today: await Order.countDocuments({
        createdAt: {
            $gte: start,
            $lte: end
        }
    }),

    pending: await Order.countDocuments({
        orderStatus: {
            $in: ["Pending", "Confirmed", "Processing"]
        }
    }),

    shipped: await Order.countDocuments({
        orderStatus: {
            $in: ["Shipped", "Out For Delivery"]
        }
    }),

    delivered: await Order.countDocuments({
        orderStatus: "Delivered"
    }),

    cancelled: await Order.countDocuments({
        orderStatus: {
            $in: [
                "Cancelled",
                "Returned",
                "Partially Cancelled",
                "Partially Returned"
            ]
        }
    })
};

const message = req.session.message || null;
delete req.session.message;

        res.render("admin/orders/orders", {

            orders: paginatedOrders,

            currentPage: page,

            totalPages,

            totalOrders,

            search,

            message,

            status,

            sort,

            dateRange,

            limit,

            stats,

            payment,

            active:"orders"

        });

    }

    catch (error) {

        console.log(error);

        res.redirect("/admin/dashboard");

    }

};

const updateOrderStatusFromItems = (order) => {

    const total = order.items.length;

    const cancelled = order.items.filter(i => i.itemStatus === "Cancelled").length;

    const returned = order.items.filter(i => i.itemStatus === "Returned").length;

    if (cancelled === total) {

        order.orderStatus = "Cancelled";

    }

    else if (cancelled > 0) {

        order.orderStatus = "Partially Cancelled";

    }

    else if (returned === total) {

        order.orderStatus = "Returned";

    }

    else if (returned > 0) {

        order.orderStatus = "Partially Returned";

    }else {
   
    order.orderStatus = order.items[0].itemStatus;
}

    if (
        order.orderStatus === "Cancelled" ||
        order.orderStatus === "Partially Cancelled"
    ) {

        if (order.paymentMethod === "RAZORPAY") {

            order.paymentStatus = "Refund Pending";

        }

        else if (order.paymentMethod === "WALLET") {

            order.paymentStatus = "Refunded";

        }

        else {

            order.paymentStatus = "Pending";

        }

    }

};

export const loadOrderDetails = async (req, res) => {

    try {

        const order = await Order.findById(req.params.id)

            .populate({
                path: "user",
               select: "firstName lastName email phone createdAt"
            })

            .populate({
                path: "items.product"
            })

            .populate({
                path: "items.variant"
            });

        if (!order) {

            return res.redirect("/admin/orders");

        }

        const message = req.session.message || null;

delete req.session.message;

        res.render("admin/orders/order-details", {

            order,
              message,
               active:"orders"


        });

    }

    catch (error) {

        console.log(error);

        res.redirect("/admin/orders");

    }

};

export const getOrderDetails = async (req, res) => {

    try {

       const order = await Order.findById(req.params.orderId)
    .populate("user")
    .populate({
        path: "items.product",
        populate: {
            path: "brand category"
        }
    })
    .populate("items.variant")
    .populate("coupon");
        if (!order) {

    req.session.message = {
        type: "error",
        text: "Order not found"
    };

    return res.redirect("/admin/orders");

}

const message = req.session.message || null;
delete req.session.message;

res.render("admin/order-details", {
    order,
    currentPage: "orders",
    message,
     active:"orders"
});

    }

  catch (error) {

    console.log(error);

    req.session.message = {
        type: "error",
        text: "Something went wrong"
    };

    res.redirect("/admin/orders");

}

};

export const updateOrderStatus = async (req, res) => {

    try {

        const { orderStatus } = req.body;

        const order = await Order.findById(req.params.orderId);

        if (!order) {

    req.session.message = {
        type: "error",
        text: "Order not found"
    };

    return res.redirect("/admin/orders");

}
        const currentStatus = order.orderStatus;


        const allowedStatuses = statusFlow[currentStatus] || [];

       if (!allowedStatuses.includes(orderStatus)) {

    req.session.message = {
        type: "error",
        text: "Invalid status transition."
    };

    return res.redirect(`/admin/orders/${order._id}`);

}

        order.orderStatus = orderStatus;
       
        order.items.forEach(item => {

            if (
                item.itemStatus !== "Cancelled" &&
                item.itemStatus !== "Returned"
            ) {

                item.itemStatus = orderStatus;

            }

        });

        if (orderStatus === "Delivered") {

            order.deliveredAt = new Date();

            order.items.forEach(item => {

                if (item.itemStatus === "Delivered") {

                    item.deliveredAt = new Date();

                      order.paymentStatus = "Paid";
                }

            });

        }


        if (orderStatus === "Cancelled") {

            order.cancelledAt = new Date();

            order.items.forEach(item => {

                if (item.itemStatus === "Cancelled") {

                    item.cancelledAt = new Date();

                }
              

            });

        }
     

        if (orderStatus === "Returned") {

            order.returnedAt = new Date();

            order.items.forEach(item => {

                if (item.itemStatus === "Returned") {

                    item.returnedAt = new Date();

                }

            });

        }






updateOrderStatusFromItems(order);

await order.save();

console.log("Saved order status:", order.orderStatus);

       req.session.message = {
    type: "success",
    text: "Order status updated successfully."
};

res.redirect(`/admin/orders/${order._id}`);
    }

catch (error) {

    console.log(error);

    req.session.message = {
        type: "error",
        text: "Something went wrong."
    };

    res.redirect("/admin/orders");

}

};

