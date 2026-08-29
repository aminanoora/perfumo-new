import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Category from "../../models/Category.js";

const loadDashboard = async () => {
  const totalUsers = await User.countDocuments();

  const totalOrders = await Order.countDocuments();

  const revenueResult = await Order.aggregate([
    {
      $match: {
        $or: [
          { paymentStatus: "Paid" },
          {
            paymentMethod: "COD",
            orderStatus: "Delivered",
          },
        ],
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.itemStatus": {
          $nin: ["Cancelled", "Returned"],
        },
      },
    },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: "$items.total",
        },
      },
    },
  ]);

  const totalRevenue = revenueResult.length ? revenueResult[0].revenue : 0;

  return {
    dashboard: {
      totalUsers,

      totalOrders,

      totalRevenue,
    },
  };
};

export const getDashboardData = async (filter = "month", start, end) => {
  const [dashboardData, revenueChart, orderStatus, topProducts, topCategories] =
    await Promise.all([
      loadDashboard(),

      getRevenueChart(filter, start, end),

      getOrderStatus(),

      getTopProducts(),

      getTopCategories(),
    ]);

  return {
    dashboard: dashboardData.dashboard,

    revenueChart,

    orderStatus,

    topProducts,

    topCategories,
  };
};

async function getOrderStatus() {
  const data = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return {
    labels: data.map((i) => i._id),

    values: data.map((i) => i.count),
  };
}

async function getTopProducts() {
  return await Order.aggregate([
    {
      $match: {
        orderStatus: {
          $nin: ["Cancelled", "Returned"],
        },
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        $or: [
          {
            paymentStatus: "Paid",
          },
          {
            paymentMethod: "COD",
            orderStatus: "Delivered",
          },
        ],
      },
    },
    {
      $group: {
        _id: "$items.product",

        unitsSold: {
          $sum: "$items.quantity",
        },

        revenue: {
          $sum: "$items.total",
        },
      },
    },

    {
      $sort: {
        unitsSold: -1,
      },
    },

    {
      $limit: 3,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "variants",
        localField: "_id",
        foreignField: "product",
        as: "variants",
      },
    },
    {
      $project: {
        name: "$product.name",

        image: {
          $arrayElemAt: [
            {
              $arrayElemAt: ["$variants.images", 0],
            },
            0,
          ],
        },

        unitsSold: 1,

        revenue: 1,
      },
    },
  ]);
}
async function getTopCategories() {
  return await Order.aggregate([
    {
      $match: {
        orderStatus: {
          $nin: ["Cancelled", "Returned"],
        },
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        $or: [
          {
            paymentStatus: "Paid",
          },
          {
            paymentMethod: "COD",
            orderStatus: "Delivered",
          },
        ],
      },
    },

    {
      $group: {
        _id: "$items.product",
        unitsSold: {
          $sum: "$items.quantity",
        },
        revenue: {
          $sum: "$items.total",
        },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },

    {
      $unwind: "$category",
    },

    {
      $group: {
        _id: "$category._id",
        name: {
          $first: "$category.name",
        },
        quantity: {
          $sum: "$unitsSold",
        },
      },
    },

    {
      $sort: {
        quantity: -1,
      },
    },

    {
      $limit: 5,
    },
  ]);
}
function getDateRange(filter, start, end) {
  let from = new Date();
  let to = new Date();

  switch (filter) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;

    case "week":
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      break;

    case "month":
      from = new Date();
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;

    case "year":
      from = new Date();
      from.setMonth(0);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;

    case "custom":
      if (start && end) {
        from = new Date(start);
        from.setHours(0, 0, 0, 0);

        to = new Date(end);
        to.setHours(23, 59, 59, 999);
      }

      break;
  }

  return { from, to };
}
async function getRevenueChart(filter = "month", start, end) {
  const { from, to } = getDateRange(filter, start, end);

  let groupId;
  let sortStage;

  switch (filter) {
    case "today":
      groupId = {
        hour: {
          $hour: "$createdAt",
        },
      };

      sortStage = {
        "_id.hour": 1,
      };

      break;

    case "week":
      groupId = {
        day: {
          $dayOfWeek: "$createdAt",
        },
      };

      sortStage = {
        "_id.day": 1,
      };

      break;

    case "month":
      groupId = {
        day: {
          $dayOfMonth: "$createdAt",
        },
      };

      sortStage = {
        "_id.day": 1,
      };

      break;

    case "year":
      groupId = {
        month: {
          $month: "$createdAt",
        },
      };

      sortStage = {
        "_id.month": 1,
      };

      break;

    case "custom":
      groupId = {
        day: {
          $dateToString: {
            format: "%d-%m",
            date: "$createdAt",
          },
        },
      };

      sortStage = {
        "_id.day": 1,
      };

      break;

    default:
      groupId = {
        day: {
          $dayOfMonth: "$createdAt",
        },
      };

      sortStage = {
        "_id.day": 1,
      };

      break;
  }

  const revenue = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: from,
          $lte: to,
        },
        $or: [
          { paymentStatus: "Paid" },
          {
            paymentMethod: "COD",
            orderStatus: "Delivered",
          },
        ],
      },
    },

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.itemStatus": {
          $nin: ["Cancelled", "Returned"],
        },
      },
    },

    {
      $group: {
        _id: groupId,
        revenue: {
          $sum: "$items.total",
        },
      },
    },

    {
      $sort: sortStage,
    },
  ]);

  let labels = [];

  if (filter === "today") {
    labels = revenue.map((r) => `${r._id.hour}:00`);
  } else if (filter === "week") {
    const weekDays = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    labels = revenue.map((r) => weekDays[r._id.day]);
  } else if (filter === "month") {
    labels = revenue.map((r) => r._id.day);
  } else if (filter === "year") {
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    labels = revenue.map((r) => months[r._id.month]);
  } else {
    labels = revenue.map((r) => r._id.day);
  }

  return {
    labels,

    values: revenue.map((r) => r.revenue),
  };
}
