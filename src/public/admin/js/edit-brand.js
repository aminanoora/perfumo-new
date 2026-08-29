const form = document.getElementById("brandForm");

const name = document.getElementById("name");
const slug = document.getElementById("slug");
const description = document.getElementById("description");

const logoInput = document.getElementById("logo");
const uploadBox = document.getElementById("uploadBox");
const browseBtn = document.getElementById("browseBtn");
const previewImage = document.getElementById("previewImage");
const placeholder = document.getElementById("placeholder");
const logoActions = document.getElementById("logoActions");
const removeLogoBtn = document.getElementById("removeLogo");
const removeLogoInput = document.getElementById("removeLogoInput");

const nameError = document.getElementById("nameError");
const slugError = document.getElementById("slugError");
const descriptionError = document.getElementById("descriptionError");
const logoError = document.getElementById("logoError");

function showError(element, message) {
  element.textContent = message;
}

function clearErrors() {
  nameError.textContent = "";
  slugError.textContent = "";
  descriptionError.textContent = "";
  logoError.textContent = "";
}

function validateName() {
  const value = name.value.trim();

  if (!value) {
    showError(nameError, "Brand name is required.");
    return false;
  }

  if (value.length < 4) {
    showError(nameError, "Brand name must contain at least 4 characters.");
    return false;
  }

  if (/\d/.test(value)) {
    showError(nameError, "Numbers are not allowed.");
    return false;
  }

  return true;
}

function validateSlug() {
  const value = slug.value.trim();

  if (!value) {
    showError(slugError, "Slug is required.");
    return false;
  }

  if (value.length < 4) {
    showError(slugError, "Slug must contain at least 4 characters.");
    return false;
  }

  if (/\d/.test(value)) {
    showError(slugError, "Numbers are not allowed.");
    return false;
  }

  return true;
}

function validateDescription() {
  const value = description.value.trim();

  if (!value) {
    showError(descriptionError, "Description is required.");
    return false;
  }

  if (value.length < 4) {
    showError(
      descriptionError,
      "Description must contain at least 4 characters.",
    );
    return false;
  }

  return true;
}

name.addEventListener("input", () => {
  clearErrors();
});

slug.addEventListener("input", () => {
  clearErrors();
});

description.addEventListener("input", () => {
  clearErrors();
});

browseBtn.addEventListener("click", () => {
  logoInput.click();
});

uploadBox.addEventListener("click", () => {
  logoInput.click();
});

logoInput.addEventListener("change", function () {
  logoError.textContent = "";

  const file = this.files[0];

  if (!file) return;

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (!allowed.includes(file.type)) {
    this.value = "";

    showError(logoError, "Only JPG, PNG and WEBP images are allowed.");

    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    this.value = "";

    showError(logoError, "Image size should not exceed 2MB.");

    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    previewImage.src = e.target.result;

    previewImage.style.display = "block";

    placeholder.style.display = "none";

    logoActions.style.display = "flex";

    removeLogoInput.value = "false";
  };

  reader.readAsDataURL(file);
});

removeLogoBtn.addEventListener("click", () => {
  logoInput.value = "";

  previewImage.src = "";

  previewImage.style.display = "none";

  placeholder.style.display = "flex";

  logoActions.style.display = "none";

  removeLogoInput.value = "true";
});

form.addEventListener("submit", function (e) {
  clearErrors();

  const valid = validateName() & validateSlug() & validateDescription();

  if (!valid) {
    e.preventDefault();
  }
});
