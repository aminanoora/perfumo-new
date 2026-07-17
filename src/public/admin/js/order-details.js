document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("statusForm");

    if (!form) return;

    const statusSelect = document.getElementById("orderStatus");
    const updateBtn = document.getElementById("updateStatusBtn");

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
    const currentStatus = statusSelect.dataset.current;

    statusSelect.value = currentStatus;

    const allowed = statusFlow[currentStatus] || [];

    Array.from(statusSelect.options).forEach(option => {

        if (option.value === currentStatus || option.value === "") return;

        if (!allowed.includes(option.value)) {

            option.disabled = true;

        }

    });

    if (allowed.length === 0) {

        statusSelect.disabled = true;

        updateBtn.disabled = true;

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (statusSelect.value === currentStatus) {

            Swal.fire({
                icon: "info",
                title: "No Changes",
                text: "Please select a different status."
            });

            return;

        }

        const result = await Swal.fire({

            title: "Update Order Status?",

            text: `Change status to "${statusSelect.value}"?`,

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Update",

            cancelButtonText: "Cancel",

            confirmButtonColor: "#111827"

        });

        if (!result.isConfirmed) return;

        updateBtn.disabled = true;

        updateBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Updating...
        `;

        form.submit();

    });

});