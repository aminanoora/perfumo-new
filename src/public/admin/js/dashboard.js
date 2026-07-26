document.addEventListener("DOMContentLoaded", () => {

    const filter = document.getElementById("dashboardFilter");
    const customRange = document.getElementById("customDateRange");
    const applyBtn = document.getElementById("applyDateFilter");

    let revenueChart = null;
    let orderStatusChart = null;
    let categoryChart = null;

    initializeCharts();

    loadDashboard();

    filter.addEventListener("change", () => {

        if (filter.value === "custom") {

            customRange.style.display = "flex";
            return;

        }

        customRange.style.display = "none";

        loadDashboard(filter.value);

    });

    applyBtn.addEventListener("click", () => {

        const start = document.getElementById("startDate").value;
        const end = document.getElementById("endDate").value;

        if (!start || !end) {

            Swal.fire({
                icon: "warning",
                title: "Missing Dates",
                text: "Please select both dates."
            });

            return;

        }

        loadDashboard("custom", start, end);

    });

    async function loadDashboard(type = "month", start = "", end = "") {

        try {

            let url = `/admin/dashboard/data?filter=${type}`;

            if (type === "custom") {

                url += `&start=${start}&end=${end}`;

            }

            const response = await fetch(url);

            const result = await response.json();

            if (!result.success) {

                Swal.fire({
                    icon: "error",
                    title: "Dashboard",
                    text: result.message || "Unable to load dashboard."
                });

                return;

            }

            updateCards(result.dashboard);

            updateRevenueChart(result.revenueChart);

            updateStatusChart(result.orderStatus);

            updateCategoryChart(result.topCategories);

            updateProducts(result.topProducts);

        }

        catch (error) {

            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Network Error",
                text: "Unable to load dashboard."
            });

        }

    }

    function updateCards(data) {

        animateValue(

            document.getElementById("totalOrders"),

            Number(document.getElementById("totalOrders").textContent.replace(/\D/g, "")) || 0,

            data.totalOrders

        );

        animateValue(

            document.getElementById("totalUsers"),

            Number(document.getElementById("totalUsers").textContent.replace(/\D/g, "")) || 0,

            data.totalUsers

        );

        animateMoney(

            document.getElementById("totalRevenue"),

            data.totalRevenue

        );

    }

    function initializeCharts() {

        revenueChart = new Chart(

            document.getElementById("revenueChart"),

            {

                type: "line",

                data: {

                    labels: [],

                    datasets: [{

                         label: "Revenue",

                        data: [],

                        borderColor: "#3666d6",

                        backgroundColor: "rgba(54, 203, 214, 0.15)",

                        tension: .4,

                        fill: true

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );

        orderStatusChart = new Chart(

            document.getElementById("orderStatusChart"),

            {

                type: "bar",

                data: {

                    labels: [],

                    datasets: [{

                        label: "Orders",

                        data: [],

                        backgroundColor: "#2245de"

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );

        categoryChart = new Chart(

            document.getElementById("categoryChart"),

            {

                type: "doughnut",

                data: {

                    labels:  [],

                    datasets: [{

                        data: [],

                        backgroundColor: [

                            "#3669d6",

                            "#222B3C",

                            "#60738B",

                            "#BAC6D6",

                            "#6eaada"

                        ]

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );

    }

    function updateRevenueChart(data) {

        revenueChart.data.labels = data.labels;

        revenueChart.data.datasets[0].data = data.values;

        revenueChart.update();

    }

    function updateStatusChart(data) {

        orderStatusChart.data.labels = data.labels;

        orderStatusChart.data.datasets[0].data = data.values;

        orderStatusChart.update();

    }

    function updateCategoryChart(data) {

        categoryChart.data.labels = data.map(i => i.name);

        categoryChart.data.datasets[0].data = data.map(i => i.quantity);

        categoryChart.update();

    }

    function updateProducts(products) {

        const container = document.querySelector(".top-products-list");

        container.innerHTML = "";

        if (!products.length) {

            container.innerHTML =

                `<div class="empty-state">No sales available</div>`;

            return;

        }

        products.forEach((product, index) => {

            container.innerHTML += `

            <div class="product-item">

                <div class="product-rank">${index + 1}</div>

                <div class="product-image">

                    <img src="/admin/uploads/products/${product.image}">

                </div>

                <div class="product-details">

                    <h5>${product.name}</h5>

                    <span>${product.unitsSold} Units Sold</span>

                </div>

                <div class="product-revenue">

                    ₹${product.revenue.toLocaleString("en-IN")}

                </div>

            </div>

            `;

        });

    }

    function animateValue(element, start, end) {

        let current = start;

        const increment = Math.ceil((end - start) / 30);

        const timer = setInterval(() => {

            current += increment;

            if (current >= end) {

                current = end;

                clearInterval(timer);

            }

            element.textContent = current.toLocaleString("en-IN");

        }, 20);

    }

    function animateMoney(element, value) {

        let current = 0;

        const increment = Math.ceil(value / 30);

        const timer = setInterval(() => {

            current += increment;

            if (current >= value) {

                current = value;

                clearInterval(timer);

            }

            element.textContent =

                "₹" + current.toLocaleString("en-IN");

        }, 20);

    }



});