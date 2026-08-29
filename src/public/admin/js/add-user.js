document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addUserForm");
  const firstName = document.getElementById("firstName");
  const preview = document.getElementById("profilePreview");
  const imageInput = document.getElementById("profileImage");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("passwordInput");

  function failed(element, message) {
    const content = element.closest(".input-group");
    const small = content.querySelector("small");
    if (small) small.innerText = message;
    content.classList.remove("success");
    content.classList.add("error");
  }

  function success(element) {
    const content = element.closest(".input-group");
    const small = content.querySelector("small");
    if (small) small.innerText = "";
    content.classList.remove("error");
    content.classList.add("success");
  }

  function validateField(element) {
    const val = element.value.trim();
    const fieldName =
      element.getAttribute("placeholder") || element.name || "Field";

    if (!val) {
      failed(element, `${fieldName} is required`);
      return false;
    } else {
      success(element);
      return true;
    }
  }

  form.querySelectorAll("input, select").forEach((element) => {
    if (element.type === "file" || element.type === "hidden") return;

    element.addEventListener("input", () => {
      validateField(element);

      if (element === firstName && imageInput && !imageInput.files.length) {
        const val = firstName.value.trim();
        preview.textContent = val ? val.charAt(0).toUpperCase() : "A";
      }
    });
  });

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (!imageInput.files || imageInput.files.length === 0) return;

      const file = imageInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}">`;
      };
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let isFormValid = true;

    form.querySelectorAll("input, select").forEach((element) => {
      if (element.type === "file" || element.type === "hidden") return;

      const isValid = validateField(element);
      if (!isValid) {
        isFormValid = false;
      }
    });

    if (!isFormValid) return;

    const formData = new FormData(form);
    const res = await fetch("/admin/users/add", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (result.success) {
      await Swal.fire({
        icon: "success",
        title: "User Added",
        timer: 1500,
        showConfirmButton: false,
      });
      window.location.href = "/admin/users";
    }
  });

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      togglePassword.innerHTML =
        type === "password"
          ? '<i class="fa-solid fa-eye"></i>'
          : '<i class="fa-solid fa-eye-slash"></i>';
    });
  }
});
