document.addEventListener("DOMContentLoaded", () => {



    document.querySelectorAll(".qty-plus").forEach(btn => {

        btn.addEventListener("click", async () => {

            const itemId = btn.dataset.id;

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

            if (data.success) {

                location.reload();

            } else {

                Swal.fire({

                    icon: "warning",

                    title: data.message

                });

            }

        });

    });

  

    document.querySelectorAll(".qty-minus").forEach(btn => {

        btn.addEventListener("click", async () => {

            const itemId = btn.dataset.id;

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

            if (data.success) {

                location.reload();

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

                confirmButtonText: "Remove"

            });

            if (!result.isConfirmed) return;

            const res = await fetch(`/cart/remove/${btn.dataset.id}`, {

                method: "DELETE"

            });

            const data = await res.json();

            if (data.success) {

                Swal.fire({

                    icon: "success",

                    title: data.message,

                    timer: 1000,

                    showConfirmButton: false

                });

                setTimeout(() => {

                    location.reload();

                }, 1000);

            }

        });

    });

   

    const giftWrap = document.getElementById("giftWrap");

    if (giftWrap) {

        giftWrap.addEventListener("change", async () => {

            const res = await fetch("/cart/gift-wrap", {

                method: "PATCH"

            });

            const data = await res.json();

            if (data.success) {

                location.reload();

            }

        });

    }

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
