function updateCartBadge(count) {

    const badge = document.getElementById("cartBadge");

    if (!badge) return;

    if (count > 0) {

        badge.style.display = "flex";
        badge.textContent = count;

    } else {

        badge.style.display = "none";
        badge.textContent = "0";

    }

}

function updateCartSummary(data) {

    const subtotal =
        document.getElementById("cartSubtotal");

    const shipping =
        document.getElementById("cartShipping");

    const giftWrap =
        document.getElementById("cartGiftWrap");

    const grandTotal =
        document.getElementById("cartGrandTotal");


    if (subtotal) {

        subtotal.textContent =
            "₹" +
            Number(data.subtotal)
                .toLocaleString("en-IN");

    }


    if (shipping) {

        shipping.textContent =
            Number(data.shipping) === 0
                ? "Free"
                : "₹" +
                  Number(data.shipping)
                      .toLocaleString("en-IN");

    }


    if (giftWrap) {

        giftWrap.textContent =
            "₹" +
            Number(data.giftWrapAmount)
                .toLocaleString("en-IN");

    }


    if (grandTotal) {

        grandTotal.textContent =
            "₹" +
            Number(data.grandTotal)
                .toLocaleString("en-IN");

    }

}
document.querySelectorAll(".qty-plus").forEach(btn => {

    btn.addEventListener("click", async () => {

        const itemId = btn.dataset.id;

        try {

            btn.disabled = true;

            const res = await fetch("/cart/quantity", {

                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    itemId,

                    action: "increase"

                })

            });

            const data = await res.json();

            if (!data.success) {

                Swal.fire({

                    icon: "warning",

                    title: data.message || "Unable to update quantity"

                });

                return;

            }

            const qtyElement =
                btn.parentElement.querySelector(".qty-value");

            if (qtyElement) {

                qtyElement.value = data.quantity;

            }


            const row =
                btn.closest(".cart-row");

            const itemTotal =
                row.querySelector(".item-total");

            if (itemTotal) {

                itemTotal.textContent =
                    "₹" +
                    Number(data.itemTotal)
                        .toLocaleString("en-IN");

            }


           
            updateCartBadge(data.cartCount);


            updateCartSummary(data);


        } catch (error) {

            console.error(error);

            Swal.fire({

                icon: "error",

                title: "Unable to update cart"

            });

        } finally {

            btn.disabled = false;

        }

    });

});

document.querySelectorAll(".qty-minus").forEach(btn => {

    btn.addEventListener("click", async () => {

        const itemId = btn.dataset.id;

        try {

            btn.disabled = true;

            const res = await fetch("/cart/quantity", {

                method: "PATCH",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    itemId,

                    action: "decrease"

                })

            });

            const data = await res.json();


            if (!data.success) {

                Swal.fire({

                    icon: "warning",

                    title:
                        data.message ||
                        "Unable to update quantity"

                });

                return;

            }


      
            const qtyElement =
                btn.parentElement.querySelector(".qty-value");

            if (qtyElement) {

                qtyElement.value =
                    data.quantity;

            }


      
            const row =
                btn.closest(".cart-row");

            const itemTotal =
                row.querySelector(".item-total");

            if (itemTotal) {

                itemTotal.textContent =
                    "₹" +
                    Number(data.itemTotal)
                        .toLocaleString("en-IN");

            }


         
            updateCartBadge(data.cartCount);


            updateCartSummary(data);


        } catch (error) {

            console.error(error);

            Swal.fire({

                icon: "error",

                title: "Unable to update cart"

            });

        } finally {

            btn.disabled = false;

        }

    });

});

document.querySelectorAll(".remove-item").forEach(btn => {

    btn.addEventListener("click", async () => {

        const result = await Swal.fire({

            title: "Remove Product?",

            text: "This item will be removed from your cart.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Remove",

            cancelButtonText: "Cancel"

        });

        if (!result.isConfirmed) return;


        try {

            btn.disabled = true;


            const res = await fetch(
                `/cart/remove/${btn.dataset.id}`,
                {
                    method: "DELETE"
                }
            );


            const data = await res.json();


            if (!data.success) {

                Swal.fire({

                    icon: "error",

                    title:
                        data.message ||
                        "Unable to remove item"

                });

                btn.disabled = false;

                return;

            }


  

            updateCartBadge(data.cartCount);


          

            const row =
                btn.closest(".cart-row");

            if (row) {

                row.remove();

            }


            updateCartSummary(data);


          

            if (
                data.isEmpty ||
                data.cartCount === 0
            ) {

    const cartTable = document.getElementById("cartTable");
    const cartSummary = document.getElementById("cartSummary");
    const emptyCart = document.getElementById("emptyCart");

    if (cartTable) {
        cartTable.style.display = "none";
    }

    if (cartSummary) {
        cartSummary.style.display = "none";
    }

    if (emptyCart) {
        emptyCart.style.display = "block";
    } else {
        
        const container = document.querySelector(".container");

        if (container) {

            const emptyDiv = document.createElement("div");

            emptyDiv.className = "empty-cart";
            emptyDiv.id = "emptyCart";

            emptyDiv.innerHTML = `
                <h2>Your cart is empty</h2>

                <p>
                    Looks like you haven't added any perfumes yet.
                </p>

                <a href="/shop" class="shop-btn">
                    Shop Now
                </a>
            `;

            container.appendChild(emptyDiv);
        }
    }
}


            Swal.fire({

                icon: "success",

                title: "Item Removed",

                timer: 1000,

                showConfirmButton: false

            });


        } catch (error) {

            console.error(
                "Remove cart item error:",
                error
            );


            Swal.fire({

                icon: "error",

                title: "Unable to remove item"

            });


            btn.disabled = false;

        }

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
