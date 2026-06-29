const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

if (searchInput) {

    let timer;

    searchInput.addEventListener("input", function () {

        clearTimeout(timer);

        timer = setTimeout(() => {

            document.getElementById("searchForm").submit();

        }, 500);

    });

}

if (clearSearch) {

    clearSearch.addEventListener("click", function () {

        const path = window.location.pathname;

        window.location.href = path;

    });

}



function deleteBrand(id) {

    Swal.fire({

        title: "Delete Brand?",

        text: "This action cannot be undone.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#dc2626",

        cancelButtonColor: "#6b7280",

        confirmButtonText: "Delete"

    }).then((result) => {

        if (result.isConfirmed) {

            fetch("/admin/brand/delete/" + id, {

                method: "POST"

            })

            .then(res => res.json())

            .then(data => {

                if (data.success) {

                    Swal.fire({

                        icon: "success",

                        title: "Deleted",

                        text: data.message,

                        confirmButtonColor: "#2563eb"

                    }).then(() => {

                        window.location.href = "/admin/brand";

                    });

                } else {

                    Swal.fire({

                        icon: "error",

                        title: "Cannot Delete",

                        text: data.message,

                        confirmButtonColor: "#dc2626"

                    });

                }

            })

            .catch(() => {

                Swal.fire({

                    icon: "error",

                    title: "Error",

                    text: "Something went wrong.",

                    confirmButtonColor: "#dc2626"

                });

            });

        }

    });

}