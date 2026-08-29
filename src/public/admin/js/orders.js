document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const filterForm = document.getElementById("filterForm");
  const clearBtn = document.getElementById("clearFilters");

  let timer;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        filterForm.submit();
      }, 500);
    });
  }

  if (filterForm) {
    const selects = filterForm.querySelectorAll("select");

    selects.forEach((select) => {
      select.addEventListener("change", () => {
        filterForm.submit();
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();

      window.location.href = "/admin/orders";
    });
  }
});
