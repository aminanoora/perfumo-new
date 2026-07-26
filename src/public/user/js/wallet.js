document.addEventListener("DOMContentLoaded", () => {

    const rows = document.querySelectorAll(".wallet-table tbody tr");

    rows.forEach(row => {

        row.addEventListener("mouseenter", () => {

            row.style.cursor = "pointer";

        });

        row.addEventListener("click", () => {

            rows.forEach(r => r.classList.remove("selected-row"));

            row.classList.add("selected-row");

        });

    });

});