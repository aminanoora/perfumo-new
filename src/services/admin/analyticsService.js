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


         $or: [
        { paymentStatus: "Paid" },
        {
            paymentMethod: "COD",
            orderStatus: "Delivered"
        }
    ]

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

    orderStatus: 1,

  totalAmount: {
    $sum: {
        $map: {
            input: "$items",
            as: "item",
            in: {
                $cond: [
                    {
                        $in: [
                            "$$item.itemStatus",
                            ["Cancelled", "Returned"]
                        ]
                    },
                    0,
                    "$$item.total"
                ]
            }
        }
    }
},

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
        $or: [
            { paymentStatus: "Paid" },
            {
                paymentMethod: "COD",
                orderStatus: "Delivered"
            }
        ]
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

            orderStatus: 1,

            totalAmount: {

                $sum: {

                    $map: {

                        input: "$items",

                        as: "item",

                        in: {

                            $cond: [

                                {

                                    $in: [

                                        "$$item.itemStatus",

                                        [
                                            "Cancelled",
                                            "Returned"
                                        ]

                                    ]

                                },

                                0,

                                "$$item.total"

                            ]

                        }

                    }

                }

            },

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
async function getSalesSummary(search, datePreset, fromDate, toDate) {

    const match = {
        $or: [
            { paymentStatus: "Paid" },
            {
                paymentMethod: "COD",
                orderStatus: "Delivered"
            }
        ]
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

    pipeline.push(

        {
            $unwind: "$items"
        },

        {
            $group: {

                _id: null,

                netSales: {

                    $sum: {

                        $cond: [

                            {
                                $in: [
                                    "$items.itemStatus",
                                    [
                                        "Cancelled",
                                        "Returned"
                                    ]
                                ]
                            },

                            0,

                            "$items.total"

                        ]

                    }

                },

                refundAmount: {

                    $sum: {

                        $cond: [

                            {
                                $in: [
                                    "$items.itemStatus",
                                    [
                                        "Cancelled",
                                        "Returned"
                                    ]
                                ]
                            },

                            "$items.total",

                            0

                        ]

                    }

                }

            }

        }

    );

    const result = await Order.aggregate(pipeline);

    return result[0] || {

        netSales: 0,

        refundAmount: 0

    };

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

    const dateFilter = getDateFilter(
    datePreset,
    fromDate,
    toDate
);

    let displayStart = "-";
let displayEnd = "-";

if (Object.keys(dateFilter).length) {

    displayStart = dateFilter.$gte.toLocaleDateString("en-IN");

    displayEnd = dateFilter.$lte.toLocaleDateString("en-IN");

}
    const summary = await getSalesSummary(

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
doc.font("Helvetica-Bold");

doc.text(`Start Date : ${displayStart}`);
doc.text(`End Date   : ${displayEnd}`);

doc.moveDown(0.5);

doc.text(
    `Net Sales : ₹${summary.netSales.toLocaleString("en-IN")}`
);

doc.text(
    `Refund Amount : ₹${summary.refundAmount.toLocaleString("en-IN")}`
);

doc.moveDown(1.5);

doc.font("Helvetica");

const startX = 40;
const rowHeight = 22;

let y = doc.y;

doc
    .rect(startX, y, 520, rowHeight)
    .fillAndStroke("#e5e5e5", "#000000");

doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .fontSize(10);

doc.text("Order ID", 45, y + 6);
doc.text("Customer", 120, y + 6);
doc.text("Payment", 235, y + 6);
doc.text("Status", 320, y + 6);
doc.text("Amount", 430, y + 6);

doc.font("Helvetica");

y += rowHeight;

sales.forEach((sale) => {

    if (y > 730) {

        doc.addPage();

        y = 40;

        doc
            .rect(startX, y, 520, rowHeight)
            .fillAndStroke("#e5e5e5", "#000000");

        doc
            .fillColor("black")
            .font("Helvetica-Bold")
            .fontSize(10);

        doc.text("Order ID", 45, y + 6);
        doc.text("Customer", 120, y + 6);
        doc.text("Payment", 235, y + 6);
        doc.text("Status", 320, y + 6);
        doc.text("Amount", 430, y + 6);

        doc.font("Helvetica");

        y += rowHeight;

    }

    doc
        .rect(startX, y, 520, rowHeight)
        .stroke();

    doc.fontSize(9);

    doc.text(sale.orderId, 45, y + 6, {
        width: 70
    });

    doc.text(sale.customer, 120, y + 6, {
        width: 100
    });

    doc.text(sale.paymentMethod, 235, y + 6, {
        width: 70
    });

    doc.text(sale.orderStatus, 320, y + 6, {
        width: 70
    });

    doc.text(
        "₹" + sale.totalAmount.toLocaleString("en-IN"),
        430,
        y + 6,
        {
            width: 80,
            align: "right"
        }
    );

    y += rowHeight;

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

    const dateFilter = getDateFilter(
    datePreset,
    fromDate,
    toDate
);

    let displayStart = "-";
let displayEnd = "-";

if (Object.keys(dateFilter).length) {

    displayStart = dateFilter.$gte.toLocaleDateString("en-IN");

    displayEnd = dateFilter.$lte.toLocaleDateString("en-IN");

}

    const summary = await getSalesSummary(
        search,
        datePreset,
        fromDate,
        toDate
    );

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Sales Report");

    sheet.mergeCells("A1:G1");
    sheet.getCell("A1").value = "PERFUMO SALES REPORT";
    sheet.getCell("A1").font = {
        bold: true,
        size: 18
    };
    sheet.getCell("A1").alignment = {
        horizontal: "center"
    };

    sheet.addRow([]);

sheet.addRow(["Start Date", displayStart]);
sheet.addRow(["End Date", displayEnd]);

    sheet.addRow([
        "Net Sales",
        summary.netSales
    ]);

    sheet.addRow([
        "Refund Amount",
        summary.refundAmount
    ]);

    sheet.addRow([]);

    sheet.columns = [

        {
            header: "Order ID",
            key: "orderId",
            width: 24
        },

        {
            header: "Customer",
            key: "customer",
            width: 24
        },

        {
            header: "Products",
            key: "products",
            width: 40
        },

        {
            header: "Payment",
            key: "paymentMethod",
            width: 18
        },

        {
            header: "Status",
            key: "orderStatus",
            width: 18
        },

        {
            header: "Amount",
            key: "totalAmount",
            width: 18
        },

        {
            header: "Date",
            key: "createdAt",
            width: 18
        }

    ];

    const headerRow = sheet.getRow(7);

    headerRow.font = {
        bold: true
    };

    headerRow.alignment = {
        horizontal: "center"
    };

    headerRow.eachCell((cell) => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
                argb: "D9D9D9"
            }
        };

        cell.border = {
            top: {
                style: "thin"
            },
            left: {
                style: "thin"
            },
            bottom: {
                style: "thin"
            },
            right: {
                style: "thin"
            }
        };
    });

    sales.forEach((sale) => {

        const row = sheet.addRow({

            orderId: sale.orderId,

            customer: sale.customer,

            products: sale.products.join(", "),

            paymentMethod: sale.paymentMethod,

            orderStatus: sale.orderStatus,

            totalAmount: sale.totalAmount,

            createdAt: sale.createdAt.toLocaleDateString("en-IN")

        });

        row.getCell("totalAmount").numFmt = '₹#,##0.00';

        row.eachCell((cell) => {

            cell.border = {
                top: {
                    style: "thin"
                },
                left: {
                    style: "thin"
                },
                bottom: {
                    style: "thin"
                },
                right: {
                    style: "thin"
                }
            };

            cell.alignment = {
                vertical: "middle",
                horizontal: "left",
                wrapText: true
            };

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