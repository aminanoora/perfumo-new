document.addEventListener("DOMContentLoaded", () => {

    const paymentMethods =
        document.querySelectorAll("input[name='paymentMethod']");

    const payNowBtn =
        document.getElementById("payNowBtn");

    const placeOrderBtn =
        document.getElementById("placeOrderBtn");

    const checkoutForm =
        document.getElementById("checkoutForm");

    const couponBtn =
        document.getElementById("applyCoupon");

    const couponInput =
        document.getElementById("couponCode");

    const couponMessage =
        document.getElementById("couponMessage");

    const couponDiscount =
        document.getElementById("couponDiscount");

    const grandTotal =
        document.getElementById("grandTotal");



    function togglePaymentButtons() {

        const selected =
            document.querySelector("input[name='paymentMethod']:checked");

        if (!selected) return;

        if (selected.value === "COD") {

            payNowBtn.style.display = "none";
            placeOrderBtn.style.display = "block";

        } else {

            payNowBtn.style.display = "block";
            placeOrderBtn.style.display = "none";

        }

    }

    togglePaymentButtons();

    paymentMethods.forEach(method => {

        method.addEventListener("change", togglePaymentButtons);

    });



    couponBtn?.addEventListener("click", async () => {

        const code = couponInput.value.trim();

        if (!code) {

            Swal.fire({

                icon: "warning",
                title: "Enter Coupon Code"

            });

            return;

        }

        try {

            const response = await fetch("/checkout/apply-coupon", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    code

                })

            });

            const data = await response.json();

            if (data.success) {

                couponDiscount.textContent =
                    "- ₹" + data.discount.toLocaleString();

                grandTotal.textContent =
                    "₹" + data.total.toLocaleString();

                couponMessage.style.color = "green";

                couponMessage.innerText =
                    data.message;

                Swal.fire({

                    icon: "success",

                    title: "Coupon Applied",

                    timer: 1500,

                    showConfirmButton: false

                });

            } else {

                couponMessage.style.color = "red";

                couponMessage.innerText =
                    data.message;

                Swal.fire({

                    icon: "error",

                    title: data.message

                });

            }

        } catch (error) {

            Swal.fire({

                icon: "error",

                title: "Unable to apply coupon"

            });

        }

    });



    payNowBtn?.addEventListener("click", () => {

        const address =
            document.querySelector("input[name='addressId']:checked");

        if (!address) {

            Swal.fire({

                icon: "warning",

                title: "Select Delivery Address"

            });

            return;

        }

        checkoutForm.submit();

    });



    checkoutForm?.addEventListener("submit", (e) => {

        const address =
            document.querySelector("input[name='addressId']:checked");

        if (!address) {

            e.preventDefault();

            Swal.fire({

                icon: "warning",

                title: "Select Delivery Address"

            });

            return;

        }

    });



    document.querySelectorAll("input[name='addressId']").forEach(address => {

        address.addEventListener("change", () => {

            document.querySelectorAll(".address-card").forEach(card => {

                card.classList.remove("selected-address");

            });

            address.closest(".address-card")
                .classList.add("selected-address");

        });

    });



    const selectedAddress =
        document.querySelector("input[name='addressId']:checked");

    if (selectedAddress) {

        selectedAddress.closest(".address-card")
            .classList.add("selected-address");

    }

});