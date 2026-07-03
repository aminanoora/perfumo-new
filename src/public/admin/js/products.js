document.addEventListener("DOMContentLoaded", () => {
    const clearBtn = document.getElementById("clearSearch");

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.delete("search");
            url.searchParams.set("page", 1);
            window.location.href = url.toString();
        });
    }

    const sortSelect = document.getElementById("sortSelect");

    if (sortSelect) {
    sortSelect.addEventListener("change", function () {
        window.location.href = this.value;
    });
}

    document.querySelectorAll(".action-toggle").forEach(button => {
        button.addEventListener("click", function (e) {
            e.stopPropagation();

            document.querySelectorAll(".action-menu").forEach(menu => {
                if (menu !== this.nextElementSibling) {
                    menu.classList.remove("show");
                }
            });

            this.nextElementSibling.classList.toggle("show");
        });
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".action-menu").forEach(menu => {
            menu.classList.remove("show");
        });
    });
    document.querySelectorAll(".action-btn").forEach(button => {

    button.addEventListener("click", function (e) {

        e.stopPropagation();

        document.querySelectorAll(".action-menu").forEach(menu => {
            if (menu !== this.parentElement) {
                menu.classList.remove("active");
            }
        });

        this.parentElement.classList.toggle("active");

    });

});

document.addEventListener("click", () => {
    document.querySelectorAll(".action-menu").forEach(menu => {
        menu.classList.remove("active");
    });
});
});