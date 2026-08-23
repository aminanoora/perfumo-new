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

    discount: {
    $ifNull: ["$discount", 0]
},

createdAt: 1,

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

            discount: {
    $ifNull: ["$discount", 0]
},

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

    try {

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

            displayStart =
                dateFilter.$gte.toLocaleDateString("en-IN");

            displayEnd =
                dateFilter.$lte.toLocaleDateString("en-IN");

        }

        const summary = await getSalesSummary(
            search,
            datePreset,
            fromDate,
            toDate
        );

        const doc = new PDFDocument({
            size: "A4",
            margins: {
                top: 40,
                bottom: 40,
                left: 40,
                right: 40
            }
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

        const PAGE_WIDTH = 595.28;
        const PAGE_HEIGHT = 841.89;

        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = PAGE_WIDTH - LEFT - RIGHT;

        const columns = [
            {
                title: "Order ID",
                width: 75
            },
            {
                title: "Customer",
                width: 95
            },
            {
                title: "Products",
                width: 150
            },
            {
                title: "Payment",
                width: 65
            },
            {
                title: "Status",
                width: 75
            },
             {
        title: "Discount",
        width: 65
    },
            {
                title: "Amount",
                width: 55
            }
            ,
            {
        title: "Date",
        width: 65
    }
        ];

        const columnTotal = columns.reduce(
            (sum, column) => sum + column.width,
            0
        );

        const scale = TABLE_WIDTH / columnTotal;

        columns.forEach(column => {
            column.width =
                Math.floor(column.width * scale);
        });

        const adjustedWidth =
            columns.reduce(
                (sum, column) => sum + column.width,
                0
            );

        columns[columns.length - 1].width +=
            Math.round(TABLE_WIDTH - adjustedWidth);

        const drawTableHeader = () => {

            const headerY = doc.y;

            const headerHeight = 28;

            doc
                .rect(
                    LEFT,
                    headerY,
                    TABLE_WIDTH,
                    headerHeight
                )
                .fillAndStroke(
                    "#E5E5E5",
                    "#000000"
                );

            doc
                .fillColor("#000000")
                .font("Helvetica-Bold")
                .fontSize(8);

            let x = LEFT;

            columns.forEach(column => {

                doc.text(
                    column.title,
                    x + 4,
                    headerY + 9,
                    {
                        width: column.width - 8,
                        align: "left",
                        lineBreak: false
                    }
                );

                x += column.width;

            });

            doc.font("Helvetica");

            doc.y =
                headerY + headerHeight;

            return headerHeight;

        };

        const drawRow = sale => {

            const productText =
                Array.isArray(sale.products)
                    ? sale.products.join(", ")
                    : "";

            const amount =
                Number(sale.totalAmount || 0);

                const discount =
    Number(sale.discount || 0);

    const orderDate = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("en-IN")
    : "-";

          const values = [
    sale.orderId || "-",
    sale.customer || "-",
    productText || "-",
    sale.paymentMethod || "-",
    sale.orderStatus || "-",

    `₹${discount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`,

    `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`,

    orderDate
];

            const fontSize = 8;

            doc.font("Helvetica");
            doc.fontSize(fontSize);

            const padding = 4;

            const lineHeights = values.map(
                (value, index) => {

                    return doc.heightOfString(
                        String(value),
                        {
                            width:
                                columns[index].width -
                                padding * 2,
                            lineGap: 1
                        }
                    );

                }
            );

            const rowHeight = Math.max(
                28,
                Math.min(
                    55,
                    Math.max(...lineHeights) + 12
                )
            );

            if (
                doc.y + rowHeight >
                PAGE_HEIGHT - 45
            ) {

                doc.addPage();

                doc.y = 40;

                drawTableHeader();

            }

            const rowY = doc.y;

            doc
                .rect(
                    LEFT,
                    rowY,
                    TABLE_WIDTH,
                    rowHeight
                )
                .stroke("#000000");

            let x = LEFT;

            values.forEach(
                (value, index) => {

                    const column =
                        columns[index];

                    doc
                        .font("Helvetica")
                        .fontSize(fontSize)
                        .fillColor("#000000")
                        .text(
                            String(value),
                            x + padding,
                            rowY + 7,
                            {
                                width:
                                    column.width -
                                    padding * 2,
                                height:
                                    rowHeight - 10,
                                align:
    index >= 5 && index <= 6
        ? "right"
        : "left",
                                lineGap: 1,
                                ellipsis: true
                            }
                        );

                    x += column.width;

                    if (index < values.length - 1) {

                        doc
                            .moveTo(
                                x,
                                rowY
                            )
                            .lineTo(
                                x,
                                rowY + rowHeight
                            )
                            .stroke("#000000");

                    }

                }
            );

            doc.y =
                rowY + rowHeight;

        };

        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .fillColor("#000000")
            .text(
                "PERFUMO SALES REPORT",
                {
                    align: "center",
                    width: TABLE_WIDTH
                }
            );

        doc.moveDown(0.8);

        doc
            .font("Helvetica")
            .fontSize(10);

        doc.text(
            `Report Period: ${displayStart} - ${displayEnd}`,
            {
                align: "center",
                width: TABLE_WIDTH
            }
        );

        doc.moveDown(1);

        const summaryY = doc.y;

        const summaryBoxHeight = 58;

        doc
            .rect(
                LEFT,
                summaryY,
                TABLE_WIDTH,
                summaryBoxHeight
            )
            .stroke("#000000");

        doc
            .font("Helvetica-Bold")
            .fontSize(10);

        doc.text(
            "SUMMARY",
            LEFT + 10,
            summaryY + 9
        );

        doc
            .font("Helvetica")
            .fontSize(9);

        doc.text(
            `Net Sales: ₹${Number(
                summary.netSales || 0
            ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`,
            LEFT + 10,
            summaryY + 27
        );

        doc.text(
            `Refund Amount: ₹${Number(
                summary.refundAmount || 0
            ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`,
            LEFT + 260,
            summaryY + 27
        );

        doc.y =
            summaryY +
            summaryBoxHeight +
            20;

        drawTableHeader();

        sales.forEach(sale => {

            drawRow(sale);

        });

        if (sales.length === 0) {

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "No sales found for the selected period.",
                    LEFT,
                    doc.y + 15,
                    {
                        width: TABLE_WIDTH,
                        align: "center"
                    }
                );

        }

        doc.end();

    } catch (error) {

        console.log(
            "exportPdf ERROR:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({
                success: false,
                message: "Failed to generate PDF"
            });

        }

    }

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
        header: "Discount",
        key: "discount",
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

    discount: Number(sale.discount || 0),

    totalAmount: sale.totalAmount,

    createdAt: sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString("en-IN")
        : "-"

});

       row.getCell("discount").numFmt = '₹#,##0.00';

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