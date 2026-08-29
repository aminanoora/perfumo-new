document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const retryOrder = params.get("retryOrder");

  const paymentMethods = document.querySelectorAll(
    "input[name='paymentMethod']",
  );

  const payNowBtn = document.getElementById("payNowBtn");

  const placeOrderBtn = document.getElementById("placeOrderBtn");

  const checkoutForm = document.getElementById("checkoutForm");

  const couponBtn = document.getElementById("applyCoupon");

  const couponInput = document.getElementById("couponCode");

  const couponMessage = document.getElementById("couponMessage");

  const couponDiscount = document.getElementById("couponDiscount");

  const grandTotal = document.getElementById("grandTotal");

  const removeCouponBtn = document.getElementById("removeCoupon");

  function togglePaymentButtons() {
    const selected = document.querySelector(
      "input[name='paymentMethod']:checked",
    );

    if (!selected) return;

    if (selected.value === "COD" || selected.value === "WALLET") {
      payNowBtn.style.display = "none";
      placeOrderBtn.style.display = "block";
    } else {
      payNowBtn.style.display = "block";
      placeOrderBtn.style.display = "none";
    }
  }

  togglePaymentButtons();

  paymentMethods.forEach((method) => {
    method.addEventListener("change", togglePaymentButtons);
  });

  couponBtn?.addEventListener("click", async () => {
    const code = couponInput.value.trim();

    if (!code) {
      Swal.fire({
        icon: "warning",
        title: "Enter Coupon Code",
      });

      return;
    }

    try {
      const response = await fetch("/checkout/apply-coupon", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          code,
          retryOrder: retryOrder || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        couponDiscount.textContent = "- ₹" + data.discount.toLocaleString();

        grandTotal.textContent = "₹" + data.total.toLocaleString();

        couponMessage.style.color = "green";

        couponMessage.innerText = data.message;

        removeCouponBtn.style.display = "inline-block";
        couponBtn.style.display = "none";
        couponInput.readOnly = true;

        Swal.fire({
          icon: "success",

          title: "Coupon Applied",

          timer: 1500,

          showConfirmButton: false,
        });
      } else {
        couponMessage.style.color = "red";

        couponMessage.innerText = data.message;

        Swal.fire({
          icon: "error",

          title: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",

        title: "Unable to apply coupon",
      });
    }
  });
  removeCouponBtn?.addEventListener("click", async () => {
    try {
      const response = await fetch("/checkout/remove-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          retryOrder: retryOrder || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        couponInput.value = "";

        couponInput.readOnly = false;

        couponBtn.style.display = "inline-block";

        removeCouponBtn.style.display = "none";

        couponDiscount.textContent = "- ₹0";

        grandTotal.textContent = "₹" + data.total.toLocaleString();

        couponMessage.style.color = "green";

        couponMessage.innerText = data.message;

        Swal.fire({
          icon: "success",
          title: "Coupon Removed",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: data.message,
        });
      }
    } catch (error) {
      console.error("Remove coupon error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to remove coupon",
      });
    }
  });

  payNowBtn.addEventListener("click", async () => {
    try {
      const address = document.querySelector("input[name='addressId']:checked");

      if (!address) {
        return Swal.fire({
          icon: "warning",
          title: "Select Delivery Address",
        });
      }

      const selectedPayment = document.querySelector(
        "input[name='paymentMethod']:checked",
      );

      if (!selectedPayment) {
        return Swal.fire({
          icon: "warning",
          title: "Select Payment Method",
        });
      }

      const paymentMethod = selectedPayment.value;

      if (paymentMethod !== "RAZORPAY") {
        checkoutForm.submit();
        return;
      }
      let pendingData;

      if (retryOrder) {
        pendingData = {
          success: true,
          orderId: retryOrder,
        };
      } else {
        const pending = await fetch("/checkout/create-pending-order", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            addressId: address.value,
          }),
        });

        pendingData = await pending.json();
      }

      if (!pendingData.success) {
        await Swal.fire({
          icon: "error",

          title: "Product Unavailable",
          text: pendingData.message,
          confirmButtonText: "Go to Cart",
        });

        if (pendingData.redirect) {
          window.location.href = pendingData.redirect;
        }

        return;
      }

      const razorpay = await fetch("/checkout/create-order", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: pendingData.orderId,
        }),
      });

      const razorData = await razorpay.json();

      if (!razorData.success) {
        return Swal.fire({
          icon: "error",
          title: "Unable to create Razorpay Order",
        });
      }

      openRazorpay(razorData.razorpayOrder, razorData.mongoOrderId);
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
      });
    }
  });

  checkoutForm?.addEventListener("submit", (e) => {
    const address = document.querySelector("input[name='addressId']:checked");

    if (!address) {
      e.preventDefault();

      Swal.fire({
        icon: "warning",

        title: "Select Delivery Address",
      });

      return;
    }
  });

  document.querySelectorAll("input[name='addressId']").forEach((address) => {
    address.addEventListener("change", () => {
      document.querySelectorAll(".address-card").forEach((card) => {
        card.classList.remove("selected-address");
      });

      address.closest(".address-card").classList.add("selected-address");
    });
  });

  const selectedAddress = document.querySelector(
    "input[name='addressId']:checked",
  );

  if (selectedAddress) {
    selectedAddress.closest(".address-card").classList.add("selected-address");
  }
  document.querySelectorAll(".selectCoupon").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.code;

      document.getElementById("couponCode").value = code;

      document.getElementById("applyCoupon").click();
    });
  });
});
