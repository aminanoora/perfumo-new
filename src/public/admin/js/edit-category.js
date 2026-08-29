const form = document.getElementById("categoryForm");

const name = document.getElementById("name");
const slug = document.getElementById("slug");
const description = document.getElementById("description");

const imageInput = document.getElementById("image");
const browseBtn = document.getElementById("browseBtn");
const changeBtn = document.getElementById("changeImageBtn");
const uploadBox = document.getElementById("uploadBox");
const preview = document.getElementById("previewImage");
const placeholder = document.getElementById("uploadPlaceholder");
const removeBtn = document.getElementById("removeImage");
const removeInput = document.getElementById("removeImageInput");

browseBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  imageInput.click();
});

changeBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  preview.src = URL.createObjectURL(file);

  preview.classList.remove("hidden");

  placeholder.classList.add("hidden");

  changeBtn.style.display = "inline-flex";

  removeBtn.style.display = "inline-flex";

  removeInput.value = "false";
});

removeBtn.addEventListener("click", () => {
  preview.src = "";
  preview.classList.add("hidden");

  if (placeholder) {
    placeholder.classList.remove("hidden");
  }

  imageInput.value = "";

  removeInput.value = "true";
});

form.addEventListener("submit", function (e) {
  let valid = true;

  clearErrors();

  const alphaRegex = /^[A-Za-z\s-]+$/;

  if (name.value.trim() === "") {
    showError(name, "nameError", "Category name is required");

    valid = false;
  } else if (name.value.trim().length < 3) {
    showError(name, "nameError", "Minimum 3 characters required");

    valid = false;
  } else if (!alphaRegex.test(name.value.trim())) {
    showError(name, "nameError", "Only letters are allowed");

    valid = false;
  }

  if (slug.value.trim() === "") {
    showError(slug, "slugError", "Slug is required");

    valid = false;
  } else if (slug.value.trim().length < 3) {
    showError(slug, "slugError", "Minimum 3 characters required");

    valid = false;
  }

  if (description.value.trim() === "") {
    showError(description, "descriptionError", "Description is required");

    valid = false;
  }

  if (!valid) {
    e.preventDefault();
  }
});

function showError(input, errorId, message) {
  input.classList.add("input-error");

  document.getElementById(errorId).innerText = message;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((error) => {
    error.innerText = "";
  });

  document.querySelectorAll("input,textarea").forEach((input) => {
    input.classList.remove("input-error");
  });
}

[name, slug, description].forEach((field) => {
  field.addEventListener("input", function () {
    this.classList.remove("input-error");

    document.getElementById(this.id + "Error").innerText = "";
  });
});
