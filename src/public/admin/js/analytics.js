let page = 1;
let limit = 10;
let timer = null;

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");

const filter = document.getElementById("dateFilter");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const customDate = document.getElementById("customDate");

const table = document.getElementById("salesTable");
const pagination = document.getElementById("pagination");

function toggleClearButton() {
    clearBtn.style.display =
        searchInput.value.trim() ? "flex" : "none";
}

async function loadSales() {

    const params = new URLSearchParams();

    params.append("page", page);
    params.append("limit", limit);
    params.append("search", searchInput.value.trim());
    params.append("datePreset", filter.value);

    if (filter.value === "custom") {
        params.append("fromDate", fromDate.value);
        params.append("toDate", toDate.value);
    }

    const response = await fetch(`/admin/analytics/data?${params.toString()}`);

    const data = await response.json();

    if (!data.success) {
        Swal.fire("Error", data.message, "error");
        return;
    }

    renderTable(data.sales);
    renderPagination(data.totalPages);
}

function renderTable(rows) {

    table.innerHTML = "";

    if (!rows.length) {

        table.innerHTML = `
        <tr>
            <td colspan="5" class="empty-data">
                No Sales Found
            </td>
        </tr>
        `;

        return;

    }

    rows.forEach(order => {

       const products = order.products
    .map(name => `
        <div class="ordered-product">
            ${name}
        </div>
    `)
    .join("");

        table.innerHTML += `

        <tr>

            <td>${order.orderId}</td>

            <td>${order.customer}</td>

            <td>
                ${products}
            </td>

            <td>
                <span class="payment-badge">
                    ${order.paymentMethod}
                </span>
            </td>

          <td>${order.orderStatus}</td>


            <td class="amount">
                ₹${Number(order.totalAmount).toLocaleString("en-IN")}
            </td>

        </tr>

        `;

    });

}
function renderPagination(totalPages) {

    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {

        pagination.innerHTML += `
        <button
            class="${page === i ? "active" : ""}"
            onclick="changePage(${i})">
            ${i}
        </button>
        `;
    }
}

window.changePage = function (current) {

    page = current;
    loadSales();
};

searchInput.addEventListener("input", () => {

    toggleClearButton();

    clearTimeout(timer);

    timer = setTimeout(() => {

        page = 1;
        loadSales();

    }, 300);
});

clearBtn.addEventListener("click", () => {

    searchInput.value = "";
    searchInput.focus();

    toggleClearButton();

    page = 1;
    loadSales();
});

filter.addEventListener("change", () => {

    customDate.style.display =
        filter.value === "custom" ? "flex" : "none";

    page = 1;
    loadSales();
});

fromDate.addEventListener("change", () => {

    page = 1;
    loadSales();
});

toDate.addEventListener("change", () => {

    page = 1;
    loadSales();
});

document.getElementById("pdfBtn").addEventListener("click", () => {

    const params = new URLSearchParams({
        search: searchInput.value.trim(),
        datePreset: filter.value,
        fromDate: fromDate.value,
        toDate: toDate.value
    });

    window.location =
        `/admin/analytics/export/pdf?${params.toString()}`;
});

document.getElementById("excelBtn").addEventListener("click", () => {

    const params = new URLSearchParams({
        search: searchInput.value.trim(),
        datePreset: filter.value,
        fromDate: fromDate.value,
        toDate: toDate.value
    });

    window.location =
        `/admin/analytics/export/excel?${params.toString()}`;
});

toggleClearButton();
loadSales();