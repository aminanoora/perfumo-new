document.addEventListener("DOMContentLoaded", () => {
const isLoggedIn = window.isLoggedIn;
   const mainImage = document.getElementById("mainProductImage");
const thumbnails = document.querySelectorAll(".thumb-image");
    const selectedVariantId = window.selectedVariantId;
    const qtyInput = document.getElementById("quantity");

    thumbnails.forEach((thumb) => {

        thumb.addEventListener("click", () => {

            thumbnails.forEach(item =>
                item.classList.remove("active")
            );

            thumb.classList.add("active");

            mainImage.src = thumb.src;
        });

    });


    const wishlistBtn = document.querySelector(".wishlist-btn");

    if (wishlistBtn) {

        wishlistBtn.addEventListener("click", () => {

            wishlistBtn.classList.toggle("active");

            const icon = wishlistBtn.querySelector("i");

            if (wishlistBtn.classList.contains("active")) {

                icon.classList.remove("fa-regular");
                icon.classList.add("fa-solid");

            } else {

                icon.classList.remove("fa-solid");
                icon.classList.add("fa-regular");

            }

        });

    }

 
   const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

    const stock = Number(qtyInput?.dataset.stock || 1);

    if (minusBtn && plusBtn && qtyInput) {

        minusBtn.addEventListener("click", () => {

            let qty = Number(qtyInput.value);

            if (qty > 1) {

                qtyInput.value = qty - 1;

            }

        });

        plusBtn.addEventListener("click", () => {

            let qty = Number(qtyInput.value);

            if (qty < stock) {

                qtyInput.value = qty + 1;

            }

        });

        qtyInput.addEventListener("input", () => {

            let value = Number(qtyInput.value);

            if (value < 1 || isNaN(value)) {

                qtyInput.value = 1;

            }

            if (value > stock) {

                qtyInput.value = stock;

            }

        });

    }


const sizeButtons = document.querySelectorAll(".variant-btn");
sizeButtons.forEach(button => {

    button.addEventListener("click", () => {

        const variantId = button.dataset.id;

        window.location.href =
            `${window.location.pathname}?variant=${variantId}`;

    });

    });
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



    const concentrationButtons =
        document.querySelectorAll(".concentration-btn");

    concentrationButtons.forEach(button => {

        button.addEventListener("click", () => {

            concentrationButtons.forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

        });

    });


    const cartBtn = document.querySelector(".cart-btn");

    cartBtn.addEventListener("click", async () => {

    if (!isLoggedIn) {

        window.location.href =
            "/signin?redirect=" +
            encodeURIComponent(window.location.pathname);

        return;
    }

    const response = await fetch("/cart/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            variantId: selectedVariantId,
            quantity: Number(quantity.value)
        })
    });

    const data = await response.json();

    if (data.success) {

        Swal.fire({
            icon: "success",
            title: "Added to Cart",
            text: data.message
        });

    } else {

        Swal.fire({
            icon: "error",
            title: "Oops",
            text: data.message
        });

    }

});

    const goCartBtn = document.querySelector(".go-cart-btn");

    if (goCartBtn) {

        goCartBtn.addEventListener("click", () => {

            window.location.href = "/cart";

        });

    }

});