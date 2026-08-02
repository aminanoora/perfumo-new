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

    const cancelWholeBtn = document.getElementById("cancelWholeOrderBtn");

if (cancelWholeBtn) {

    cancelWholeBtn.addEventListener("click", async () => {

        const result = await Swal.fire({
            title: "Cancel this order?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Cancel"
        });

        if (!result.isConfirmed) return;

        const response = await fetch(
            `/orders/${cancelWholeBtn.dataset.order}/cancel`,
            {
                method: "PATCH"
            }
        );

        const data = await response.json();

        if (data.success) {

            await Swal.fire({
                icon: "success",
                title: data.message
            });

            location.reload();

        } else {

            Swal.fire({
                icon: "error",
                title: data.message
            });

        }

    });

}

const returnWholeBtn = document.getElementById("returnWholeOrderBtn");

if (returnWholeBtn) {

    returnWholeBtn.addEventListener("click", async () => {

        const totalPaid = Number(returnWholeBtn.dataset.total);
        const shipping = Number(returnWholeBtn.dataset.shipping);
        const returnFee = 100;

        const refund = Math.max(
            0,
            totalPaid - shipping - returnFee
        );

        const confirm = await Swal.fire({
            title: "Return Whole Order",
            html: `
                <div style="text-align:left">
                    <p>Total Paid : ₹${totalPaid}</p>
                    <p>Less Shipping : -₹${shipping}</p>
                    <p>Less Return Fee : -₹${returnFee}</p>
                    <hr>
                    <h3>Estimated Refund : ₹${refund}</h3>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continue"
        });

        if (!confirm.isConfirmed) return;

        const { value: reason } = await Swal.fire({
            title: "Reason for Return",
            input: "textarea",
            inputLabel: "Reason",
            inputValidator: value => {
                if (!value) return "Reason required";
            },
            showCancelButton: true
        });

        if (!reason) return;

        const response = await fetch(
            `/orders/${returnWholeBtn.dataset.order}/return`,
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

            await Swal.fire({
                icon: "success",
                title: data.message
            });

            location.reload();

        } else {

            Swal.fire({
                icon: "error",
                title: data.message
            });

        }

    });

}
const profileToggle =
document.getElementById('profileToggle');

const profileMenu =
document.getElementById('profileMenu');

if(profileToggle){

    profileToggle.addEventListener('click', (e) => {

        e.preventDefault();

        profileMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {

        if(
            !profileToggle.contains(e.target) &&
            !profileMenu.contains(e.target)
        ){
            profileMenu.classList.remove('show');
        }
    });
}

});