document.addEventListener("DOMContentLoaded", () => {

    const moveButtons = document.querySelectorAll(".move-cart-btn");
    const removeButtons = document.querySelectorAll(".remove-btn");

    moveButtons.forEach(button => {

        button.addEventListener("click", async function () {

            if (button.disabled) return;

            button.disabled = true;

            const variantId = button.dataset.variant;


            if (!variantId) {

                Swal.fire({
                    icon: "error",
                    title: "Invalid product"
                });

                button.disabled = false;
                return;

            }

            try {

                const response = await fetch("/wishlist/move-to-cart", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        variantId
                    })

                });

                const data = await response.json();

                if (data.success) {

                  const badge = document.getElementById("wishlistBadge");

if (badge) {

    badge.textContent = data.wishlistCount;

    badge.style.display =
        data.wishlistCount > 0 ? "flex" : "none";
}

                    Swal.fire({

                        icon: "success",

                        title: "Added to Cart",

                        text: data.message,

                        timer: 1500,

                        showConfirmButton: false

                    });

                    this.closest(".wishlist-card").remove();

                    checkEmptyWishlist();

                } else {

                    Swal.fire({

                        icon: "warning",

                        title: data.message

                    });

                }

            } catch (err) {

                Swal.fire({

                    icon: "error",

                    title: "Something went wrong"

                });

            }

            button.disabled = false;

        });

    });





    removeButtons.forEach(button => {

        button.addEventListener("click", async function () {

            const result = await Swal.fire({

                title: "Remove item?",

                text: "This item will be removed from your wishlist.",

                icon: "warning",

                showCancelButton: true,

                confirmButtonText: "Remove",

                cancelButtonText: "Cancel",

                confirmButtonColor: "#dc3545"

            });

            if (!result.isConfirmed) return;

            const variantId = button.dataset.variant;

            try {

                const response = await fetch("/wishlist/remove", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        variantId
                    })

                });

                const data = await response.json();
                const badge = document.getElementById("wishlistBadge");

if (badge) {

    badge.textContent = data.wishlistCount;

    badge.style.display =
        data.wishlistCount > 0 ? "flex" : "none";
}

                if (data.success) {

                    Swal.fire({

                        icon: "success",

                        title: "Removed",

                        timer: 1200,

                        showConfirmButton: false

                    });

                    this.closest(".wishlist-card").remove();

                    checkEmptyWishlist();

                } else {

                    Swal.fire({

                        icon: "error",

                        title: data.message

                    });

                }

            } catch (err) {

                Swal.fire({

                    icon: "error",

                    title: "Unable to remove item"

                });

            }

        });

    });





    function checkEmptyWishlist() {

        const cards = document.querySelectorAll(".wishlist-card");

        if (cards.length === 0) {

            location.reload();

        }

    }

});