document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("couponForm");

    const couponId = document.getElementById("couponId").value;

    const discountType = document.getElementById("discountType");

    const maximumDiscount = document.getElementById("maximumDiscount");

    const toggleButton = document.getElementById("toggleCoupon");

    toggleMaximumDiscount();

    discountType.addEventListener("change", toggleMaximumDiscount);

    function toggleMaximumDiscount() {

        if (discountType.value === "fixed") {
            maximumDiscount.value = 0;
            maximumDiscount.disabled = true;
        } else {
            maximumDiscount.disabled = false;
        }

    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        clearErrors();

        let isValid = true;

        const formData = Object.fromEntries(new FormData(form));

        formData.code = formData.code.trim().toUpperCase();
        formData.description = formData.description.trim();

        if (formData.discountType === "fixed") {
            formData.maximumDiscount = 0;
        }

        const discountValue = Number(formData.discount);
        const minimumPurchase = Number(formData.minimumPurchase);
        const maximumDiscountValue = Number(formData.maximumDiscount);
        const usageLimit = Number(formData.usageLimit);

        const from = new Date(formData.validFrom);
        const until = new Date(formData.validUntil);

        const today = new Date();
        today.setHours(0,0,0,0);

        if (formData.code === "") {
            showFieldError("code","Coupon code is required.");
            isValid = false;
        }

        if (
            formData.code !== "" &&
            !/^[A-Z0-9_-]{3,20}$/.test(formData.code)
        ) {
            showFieldError(
                "code",
                "Coupon code must contain only letters, numbers, - or _."
            );
            isValid = false;
        }

        if (formData.description === "") {
            showFieldError("description","Description is required.");
            isValid = false;
        }

        if (formData.discountType === "") {
            showFieldError("discountType","Select discount type.");
            isValid = false;
        }

        if (discountValue <= 0) {
            showFieldError("discount","Discount should be greater than zero.");
            isValid = false;
        }

        if (
            formData.discountType === "percentage" &&
            discountValue > 100
        ) {
            showFieldError("discount","Maximum percentage is 100.");
            isValid = false;
        }

        if (minimumPurchase < 0) {
            showFieldError(
                "minimumPurchase",
                "Minimum purchase cannot be negative."
            );
            isValid = false;
        }

        if (
            formData.discountType === "percentage" &&
            maximumDiscountValue < 0
        ) {
            showFieldError(
                "maximumDiscount",
                "Maximum discount cannot be negative."
            );
            isValid = false;
        }

        if (usageLimit < 0) {
            showFieldError(
                "usageLimit",
                "Usage limit cannot be negative."
            );
            isValid = false;
        }

        if (formData.validFrom === "") {
            showFieldError("validFrom","Select start date.");
            isValid = false;
        }

        if (formData.validUntil === "") {
            showFieldError("validUntil","Select expiry date.");
            isValid = false;
        }

        if (formData.validUntil !== "" && until < today) {
            showFieldError(
                "validUntil",
                "Expiry date cannot be in the past."
            );
            isValid = false;
        }

        if (
            formData.validFrom !== "" &&
            formData.validUntil !== "" &&
            from >= until
        ) {
            showFieldError(
                "validUntil",
                "Expiry date must be after start date."
            );
            isValid = false;
        }

        if (!isValid) return;

        try {

            const response = await fetch(`/admin/coupons/view/${couponId}`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)

            });

            const data = await response.json();

            if (data.success) {

                await Swal.fire({

                    icon: "success",

                    title: "Success",

                    text: data.message,

                    confirmButtonColor: "#111827"

                });

                location.reload();

            } else {

                if (data.message.toLowerCase().includes("coupon code")) {

                    showFieldError("code", data.message);

                } else {

                    Swal.fire({

                        icon: "error",

                        title: "Error",

                        text: data.message,

                        confirmButtonColor: "#111827"

                    });

                }

            }

        } catch (error) {

            Swal.fire({

                icon: "error",

                title: "Error",

                text: "Something went wrong.",

                confirmButtonColor: "#111827"

            });

        }

    });

    toggleButton.addEventListener("click", async () => {

        const result = await Swal.fire({

            title: "Are you sure?",

            text: "Coupon status will be changed.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonColor: "#111827",

            cancelButtonColor: "#d33",

            confirmButtonText: "Yes"

        });

        if (!result.isConfirmed) return;

        try {

            const response = await fetch(`/admin/coupons/toggle/${couponId}`, {

                method: "PATCH"

            });

            const data = await response.json();

            if (data.success) {

                await Swal.fire({

                    icon: "success",

                    title: "Success",

                    text: data.message,

                    confirmButtonColor: "#111827"

                });

                location.reload();

            } else {

                Swal.fire({

                    icon: "error",

                    title: "Error",

                    text: data.message,

                    confirmButtonColor: "#111827"

                });

            }

        } catch (error) {

            Swal.fire({

                icon: "error",

                title: "Error",

                text: "Something went wrong.",

                confirmButtonColor: "#111827"

            });

        }

    });

    function clearErrors() {

        document.querySelectorAll(".error-text").forEach(error => {
            error.textContent = "";
        });

        document.querySelectorAll(".input-error").forEach(input => {
            input.classList.remove("input-error");
        });

    }

    function showFieldError(fieldName, message) {

        const input = document.querySelector(`[name="${fieldName}"]`);

        if (!input) return;

        input.classList.add("input-error");

        const error = input.parentElement.querySelector(".error-text");

        if (error) {
            error.textContent = message;
        }

    }

});