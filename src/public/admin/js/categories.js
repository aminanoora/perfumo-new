const dots = document.querySelectorAll(".dots");

dots.forEach((dot) => {
  dot.addEventListener("click", (e) => {
    e.stopPropagation();

    document.querySelectorAll(".dropdown").forEach((menu) => {
      if (menu !== dot.nextElementSibling) {
        menu.classList.remove("show");
      }
    });

    dot.nextElementSibling.classList.toggle("show");
  });
});

document.addEventListener("click", () => {
  document
    .querySelectorAll(".dropdown")
    .forEach((menu) => menu.classList.remove("show"));
});
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");
const searchForm = document.getElementById("searchForm");

if (searchInput) {
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchForm.submit();
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    window.location.href = "/admin/categories";
  });
}
