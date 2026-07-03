document.addEventListener("DOMContentLoaded", () => {
    console.log("loaded");

    const searchForm = document.querySelector(".search-form");
    const searchInput = document.querySelector(".search-box input");
    const filterForm = document.querySelector(".shop-sidebar form");

    if (searchForm) {

        searchForm.addEventListener("submit", (e) => {

            if (searchInput.value.trim() === "") {
                e.preventDefault();
                searchInput.focus();
            }

        });

    }

    
    const searchIcon = document.querySelector(".search-box .fa-magnifying-glass");

if (searchIcon) {
    searchIcon.addEventListener("click", () => {
        searchForm.submit();
    });
}

    const clearSearch = document.querySelector(".clear-search");

    if (clearSearch) {

        clearSearch.addEventListener("click", () => {

            searchInput.value = "";

        });

    }

    document.querySelectorAll(".wishlist-btn").forEach(button => {

        button.addEventListener("click", async () => {

            const productId = button.dataset.product;

            try {

                const response = await fetch("/wishlist/add", {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        productId

                    })

                });

                const data = await response.json();

                if (data.success) {

                    button.classList.add("active");

                    button.innerHTML = `<i class="fa-solid fa-heart"></i>`;

                } else {

                    Swal.fire({

                        icon: "warning",

                        title: data.message

                    });

                }

            } catch (error) {

                Swal.fire({

                    icon: "error",

                    title: "Something went wrong"

                });

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

    document.querySelectorAll(".cart-btn").forEach(button => {

        button.addEventListener("click", async () => {

    if (!window.isLoggedIn) {

        window.location.href =
            "/signin?redirect=" +
            encodeURIComponent(window.location.pathname + window.location.search);

        return;
    }

    const variantId = button.dataset.variant;

    try {

        const response = await fetch("/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                variantId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (data.success) {

            Swal.fire({
                icon: "success",
                title: "Added to cart",
                timer: 1200,
                showConfirmButton: false
            });

        } else {

            Swal.fire({
                icon: "warning",
                title: data.message
            });

        }

    } catch (error) {

        Swal.fire({
            icon: "error",
            title: "Unable to add to cart"
        });

    }

});
    });

});