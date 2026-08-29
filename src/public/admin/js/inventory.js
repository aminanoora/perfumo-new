document.addEventListener("DOMContentLoaded", () => {
  const menuButtons = document.querySelectorAll(".menu-btn");

  menuButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentDropdown = button.nextElementSibling;

      document.querySelectorAll(".dropdown-content").forEach((menu) => {
        if (menu !== currentDropdown) {
          menu.style.display = "none";
        }
      });

      if (currentDropdown.style.display === "block") {
        currentDropdown.style.display = "none";
      } else {
        currentDropdown.style.display = "block";
      }
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown-content").forEach((menu) => {
      menu.style.display = "none";
    });
  });
});
