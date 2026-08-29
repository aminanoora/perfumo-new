const form = document.getElementById("editVariantForm");

const imageInput = document.getElementById("variantImages");

const previewContainer = document.getElementById("previewContainer");

const dt = new DataTransfer();

let cropper;

let imageQueue = [];

let currentFile = null;

let selectedImages = [];

const cropModalElement = document.getElementById("cropModal");
const cropModal = new bootstrap.Modal(cropModalElement);

const cropImage = document.getElementById("cropImage");

function showNextImage() {
  console.log("showNextImage called");
  if (imageQueue.length === 0) {
    imageInput.value = "";

    return;
  }

  currentFile = imageQueue.shift();

  cropImage.src = URL.createObjectURL(currentFile);

  cropModal.show();

  setTimeout(() => {
    if (cropper) cropper.destroy();

    console.log("Creating cropper");

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,

      viewMode: 1,

      autoCropArea: 1,
    });
  }, 200);
}
imageInput.addEventListener("change", (e) => {
  console.log("File selected");

  console.log(e.target.files);
  const existingImages = document.querySelectorAll(
    ".existing-images .image-box",
  ).length;

  const totalImages =
    existingImages + selectedImages.length + e.target.files.length;

  if (totalImages > 5) {
    Swal.fire({
      icon: "error",
      title: "Maximum 5 images allowed",
    });

    imageInput.value = "";

    return;
  }

  imageQueue = [...e.target.files];

  if (!imageQueue.length) return;

  showNextImage();
});

cropModalElement.addEventListener("hidden.bs.modal", () => {
  if (cropper) {
    cropper.destroy();

    cropper = null;
  }
});
document.getElementById("cropButton").addEventListener("click", () => {
  cropper
    .getCroppedCanvas({
      width: 800,

      height: 800,
    })
    .toBlob((blob) => {
      const croppedFile = new File(
        [blob],

        currentFile.name,

        {
          type: currentFile.type,
        },
      );

      selectedImages.push(croppedFile);

      renderPreview();

      cropModal.hide();

      showNextImage();
    });
});

function renderPreview() {
  previewContainer.innerHTML = "";

  selectedImages.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const box = document.createElement("div");

      box.className = "image-box";

      box.innerHTML = `

                <img src="${e.target.result}" class="preview-image">

                <button

                    type="button"

                    class="removePreview"

                    data-index="${index}">

                    <i class="fa-solid fa-xmark"></i>

                </button>

            `;

      previewContainer.appendChild(box);
    };

    reader.readAsDataURL(file);
  });
}

previewContainer.addEventListener("click", (e) => {
  if (!e.target.closest(".removePreview")) return;

  const index = e.target.closest(".removePreview").dataset.index;

  selectedImages.splice(index, 1);

  renderPreview();
});

document.querySelectorAll(".removeExistingImage").forEach((button) => {
  button.addEventListener("click", function () {
    this.parentElement.remove();
  });
});

function clearErrors() {
  document.querySelectorAll(".error").forEach((error) => {
    error.textContent = "";
  });
}

function validateForm() {
  clearErrors();

  let valid = true;

  const sku = document.getElementById("sku").value.trim();

  const stock = document.getElementById("stock").value;

  const price = document.getElementById("price").value;

  const salePrice = document.getElementById("salePrice").value;

  const weight = document.getElementById("weight").value;

  if (sku.length < 3) {
    document.getElementById("skuError").textContent = "Invalid SKU";

    valid = false;
  }

  if (stock < 0) {
    document.getElementById("stockError").textContent = "Invalid Stock";

    valid = false;
  }

  if (price <= 0) {
    document.getElementById("priceError").textContent = "Invalid Price";

    valid = false;
  }

  if (salePrice && Number(salePrice) > Number(price)) {
    document.getElementById("salePriceError").textContent =
      "Sale price cannot exceed price";

    valid = false;
  }

  if (weight <= 0) {
    document.getElementById("weightError").textContent = "Invalid Weight";

    valid = false;
  }
  const existingImages = document.querySelectorAll(
    ".existing-images .image-box",
  ).length;

  const totalImages = existingImages + selectedImages.length;

  if (totalImages < 3) {
    document.getElementById("imageError").textContent =
      "Minimum 3 images required";

    valid = false;
  }

  return valid;
}

form.addEventListener("submit", (e) => {
  if (!validateForm()) {
    e.preventDefault();

    return;
  }

  dt.items.clear();

  selectedImages.forEach((file) => {
    dt.items.add(file);
  });

  imageInput.files = dt.files;
});
