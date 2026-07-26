import Order from "../../models/Order.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

function getDateFilter(datePreset, fromDate, toDate) {

    let filter = {};

    const today = new Date();

    switch (datePreset) {

        case "today":

            const startToday = new Date();
            startToday.setHours(0, 0, 0, 0);

            const endToday = new Date();
            endToday.setHours(23, 59, 59, 999);

            filter = {
                $gte: startToday,
                $lte: endToday
            };

            break;

        case "month":

            filter = {
                $gte: new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                ),
                $lte: today
            };

            break;

        case "year":

            filter = {
                $gte: new Date(
                    today.getFullYear(),
                    0,
                    1
                ),
                $lte: today
            };

            break;

        case "custom":

            if (fromDate && toDate) {

                filter = {

                    $gte: new Date(fromDate),

                    $lte: new Date(
                        new Date(toDate).setHours(
                            23,
                            59,
                            59,
                            999
                        )
                    )

                };

            }

            break;

    }

    return filter;

}

export const getAnalyticsData = async ({

    search = "",

    datePreset = "month",

    fromDate,

    toDate,

    page = 1,

    limit = 10

}) => {

    const match = {

        orderStatus: {

            $nin: [

                "Cancelled",

                "Returned"

            ]

        },

        paymentStatus: "Paid"

    };

    const dateFilter =
        getDateFilter(
            datePreset,
            fromDate,
            toDate
        );

    if (Object.keys(dateFilter).length) {

        match.createdAt = dateFilter;

    }

    const pipeline = [

        {
            $match: match
        },

        {
            $lookup: {

                from: "users",

                localField: "user",

                foreignField: "_id",

                as: "user"

            }

        },

        {
            $unwind: "$user"
        },
        {
    $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "products"
    }
}

    ];

    if (search) {

        pipeline.push({

            $match: {

                $or: [

                    {

                        orderId: {

                            $regex: search,

                            $options: "i"

                        }

                    },

                    {

                        "user.firstName": {

                            $regex: search,

                            $options: "i"

                        }

                    },

                    {

                        "user.lastName": {

                            $regex: search,

                            $options: "i"

                        }

                    }

                ]

            }

        });

    }

    pipeline.push({

        $sort: {

            createdAt: -1

        }

    });

    const countPipeline = [...pipeline];

    countPipeline.push({

        $count: "count"

    });

    const totalResult =
        await Order.aggregate(countPipeline);

    const total =
        totalResult.length
            ? totalResult[0].count
            : 0;

    pipeline.push(

        {

            $skip:

                (page - 1) * limit

        },

        {

            $limit: limit

        },

        {
    $project: {

        orderId: 1,

        customer: {
            $concat: [
                "$user.firstName",
                " ",
                "$user.lastName"
            ]
        },

        paymentMethod: 1,

        totalAmount: "$grandTotal",

        products: {
            $map: {
                input: "$products",
                as: "product",
                in: "$$product.name"
            }
        }

    }
}

    );

    const sales =
        await Order.aggregate(pipeline);

    return {

        sales,

        page,

        totalPages:

            Math.ceil(total / limit),

        total

    };

};

async function getExportData(search, datePreset, fromDate, toDate) {

    const match = {

        orderStatus: {
            $nin: [
                "Cancelled",
                "Returned"
            ]
        },

        paymentStatus: "Paid"

    };

    const dateFilter = getDateFilter(
        datePreset,
        fromDate,
        toDate
    );

    if (Object.keys(dateFilter).length) {

        match.createdAt = dateFilter;

    }

    const pipeline = [

        {
            $match: match
        },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },

        {
            $unwind: "$user"
        },
        {
    $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "products"
    }
},

    ];

    if (search) {

        pipeline.push({

            $match: {

                $or: [

                    {
                        orderId: {
                            $regex: search,
                            $options: "i"
                        }
                    },

                    {
                        "user.firstName": {
                            $regex: search,
                            $options: "i"
                        }
                    },

                    {
                        "user.lastName": {
                            $regex: search,
                            $options: "i"
                        }
                    }

                ]

            }

        });

    }

    pipeline.push({

        $sort: {
            createdAt: -1
        }

    });

    pipeline.push({

        $project: {

            orderId: 1,

            customer: {

                $concat: [

                    "$user.firstName",

                    " ",

                    "$user.lastName"

                ]

            },

            paymentMethod: 1,

            totalAmount: "$grandTotal",

            createdAt: 1,
            products: {
    $map: {
        input: "$products",
        as: "product",
        in: "$$product.name"
    }
}

        }

    });

    return await Order.aggregate(pipeline);

}

export const exportPdf = async (req, res) => {

    const {

        search,

        datePreset,

        fromDate,

        toDate

    } = req.query;

    const sales = await getExportData(

        search,

        datePreset,

        fromDate,

        toDate

    );

    const doc = new PDFDocument({

        margin: 40,

        size: "A4"

    });

    res.setHeader(

        "Content-Type",

        "application/pdf"

    );

    res.setHeader(

        "Content-Disposition",

        "attachment; filename=sales-report.pdf"

    );

    doc.pipe(res);

    doc

        .fontSize(20)

        .text(

            "PERFUMO SALES REPORT",

            {

                align: "center"

            }

        );

    doc.moveDown(2);

    doc.fontSize(12);

    sales.forEach((sale) => {

        doc.text(`Order ID : ${sale.orderId}`);

        doc.text(`Customer : ${sale.customer}`);

        doc.text(`Products : ${sale.products.join(", ")}`);
        
        doc.text(`Payment : ${sale.paymentMethod}`);

        doc.text(`Amount : ₹${sale.totalAmount}`);

        doc.text(`Date : ${sale.createdAt.toLocaleDateString()}`);

        doc.moveDown();

    });

    doc.end();

};

export const exportExcel = async (req, res) => {

    const {

        search,

        datePreset,

        fromDate,

        toDate

    } = req.query;

    const sales = await getExportData(

        search,

        datePreset,

        fromDate,

        toDate

    );

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Sales");

    sheet.columns = [

        {

            header: "Order ID",

            key: "orderId",

            width: 25

        },

        {

            header: "Customer",

            key: "customer",

            width: 25

        },
{
    header: "Products",
    key: "products",
    width: 40
},
        {

            header: "Payment",

            key: "paymentMethod",

            width: 20

        },

        {

            header: "Amount",

            key: "totalAmount",

            width: 18

        },

        {

            header: "Date",

            key: "createdAt",

            width: 20

        }

    ];

    sales.forEach((sale) => {

        sheet.addRow({

            orderId: sale.orderId,

            customer: sale.customer,


    products: sale.products.join(", "),

            paymentMethod: sale.paymentMethod,

            totalAmount: sale.totalAmount,

            createdAt: sale.createdAt.toLocaleDateString()

        });

    });

    res.setHeader(

        "Content-Type",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    );

    res.setHeader(

        "Content-Disposition",

        "attachment; filename=sales-report.xlsx"

    );

    await workbook.xlsx.write(res);

    res.end();

};