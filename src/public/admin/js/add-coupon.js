document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("couponForm");

    const discountType = document.getElementById("discountType");

    const maximumDiscount = document.getElementById("maximumDiscount");

    const validFrom = document.querySelector("[name='validFrom']");

    const validUntil = document.querySelector("[name='validUntil']");

    const discount = document.querySelector("[name='discount']");

    const minimumPurchase = document.querySelector("[name='minimumPurchase']");

    const usageLimit = document.querySelector("[name='usageLimit']");

    discountType.addEventListener("change", () => {

        if (discountType.value === "fixed") {

            maximumDiscount.value = 0;

            maximumDiscount.disabled = true;

        } else {

            maximumDiscount.disabled = false;

        }

    });

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        clearErrors();

        let isValid = true;

        const code = form.code.value.trim().toUpperCase();

        const description = form.description.value.trim();

        const type = discountType.value;

        const discountValue = Number(discount.value);

        const minimum = Number(minimumPurchase.value);

        const maximum = Number(maximumDiscount.value);

        const usage = Number(usageLimit.value);

        const from = new Date(validFrom.value);

        const until = new Date(validUntil.value);

        const today = new Date();

        today.setHours(0,0,0,0);

        if(code===""){

           showFieldError("code","Coupon code is required.");
isValid = false;

        }

        if(!/^[A-Z0-9_-]{3,20}$/.test(code)){

            showFieldError(
    "code",
    "Coupon code must contain only letters, numbers, - or _."
);
isValid = false;
        }

        if(description===""){

          showFieldError("description","Description is required.");
isValid = false;

        }

        if(type===""){

            showFieldError("discountType","Select discount type.");
isValid = false;
        }

        if(discountValue<=0){

           showFieldError("discount","Discount should be greater than zero.");
isValid = false;

        }

        if(type==="percentage" && discountValue>100){

          showFieldError("discount","Maximum percentage is 100.");
isValid = false;

        }

        if(minimum<0){

          showFieldError("minimumPurchase","Minimum purchase cannot be negative.");
isValid = false;

        }

        if(maximum<0){

           showFieldError("maximumDiscount","Maximum discount cannot be negative.");
isValid = false;
        }

        if(usage<0){

       showFieldError("usageLimit","Usage limit cannot be negative.");
isValid = false;
        }

        if(validFrom.value===""){

           showFieldError("validFrom","Select start date.");
isValid = false;

        }

        if(validUntil.value===""){

       showFieldError("validUntil","Select expiry date.");
isValid = false;

        }

        if(until<today){
showFieldError("validUntil","Expiry date cannot be in the past.");
isValid = false;
        }

        if(from>=until){

          showFieldError("validUntil","Expiry date must be after start date.");
isValid = false;

        }

        if (!isValid) {
    return;
}

        const formData = Object.fromEntries(new FormData(form));

        const response = await fetch("/admin/coupons/add",{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(formData)

        });

        const data = await response.json();

        if(data.success){

            await Swal.fire({

                icon:"success",

                title:"Success",

                text:data.message,

                confirmButtonColor:"#111827"

            });

            window.location="/admin/coupons";

        }else{

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

    });

    function showError(message){

        Swal.fire({

            icon:"error",

            title:"Validation Error",

            text:message,

            confirmButtonColor:"#111827"

        });

    }


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

    input.classList.add("input-error");

    input.parentElement
        .querySelector(".error-text")
        .textContent = message;

}

});