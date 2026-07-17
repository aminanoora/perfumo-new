document.addEventListener("DOMContentLoaded", () => {

    
   
    const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");
    const buyAgainBtn = document.getElementById("buyAgainBtn");
    const trackOrderBtn = document.getElementById("trackOrderBtn");

document.querySelectorAll(".cancel-item-btn").forEach(button => {

    button.addEventListener("click", async () => {

        const { value: reason } = await Swal.fire({
            title: "Cancel Item",
            input: "textarea",
            inputLabel: "Reason",
            showCancelButton: true
        });

        if (reason === undefined) return;

      const orderId = button.dataset.order;
const variantId = button.dataset.item;

        const response = await fetch(
    `/orders/${orderId}/items/${variantId}/cancel`,
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
    }
);

        const data = await response.json();

        if (data.success) {
            location.reload();
        } else {
            Swal.fire("Error", data.message, "error");
        }
    });

});

   document.querySelectorAll(".return-item-btn").forEach(button => {

    button.addEventListener("click", async () => {

        const { value: reason } = await Swal.fire({
            title: "Return Item",
            input: "textarea",
            inputValidator: value => {
                if (!value) return "Reason required";
            },
            showCancelButton: true
        });

        if (!reason) return;

       const orderId = button.dataset.order;
const variantId = button.dataset.item;

        const response =  await fetch(
    `/orders/${orderId}/items/${variantId}/return`,
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
    }
);

        const data = await response.json();

        if (data.success) {
            location.reload();
        } else {
            Swal.fire("Error", data.message, "error");
        }

    });

});
    if (downloadInvoiceBtn) {

        downloadInvoiceBtn.addEventListener("click", () => {

            const orderId = downloadInvoiceBtn.dataset.order;

            window.open(`/profile/orders/${orderId}/invoice`, "_blank");

        });

    }

    if (buyAgainBtn) {

        buyAgainBtn.addEventListener("click", async () => {

            try {

                const orderId = buyAgainBtn.dataset.order;

                const response = await fetch(`/profile/orders/${orderId}/buy-again`, {
                    method: "POST"
                });

                const data = await response.json();

                if (data.success) {

                    await Swal.fire({
                        icon: "success",
                        title: "Added to Cart",
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    });

                    window.location.href = "/cart";

                } else {

                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: data.message
                    });

                }

            } catch (error) {

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Something went wrong"
                });

            }

        });

    }

    if (trackOrderBtn) {

        trackOrderBtn.addEventListener("click", () => {

            Swal.fire({
                icon: "info",
                title: "Tracking",
                text: "Tracking feature will be available soon.",
                confirmButtonColor: "#000"
            });

        });

    }

});