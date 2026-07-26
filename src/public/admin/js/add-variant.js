document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("variantForm");
const uploadBox = document.getElementById("uploadBox");
const imageInput = document.getElementById("images");
const browseBtn = document.getElementById("browseBtn");
const previewGrid = document.getElementById("previewGrid");
const cropImage = document.getElementById("cropImage");
const cropSave = document.getElementById("cropSave");

       let isSubmitting = false;
       
const cropModal = new bootstrap.Modal(document.getElementById("cropModal"));
    function showError(fieldId, errorId, message) {
        document.getElementById(fieldId).classList.add("error-input");
        document.getElementById(errorId).innerText = message;
    }

    function clearErrors() {
        document.querySelectorAll(".error").forEach(error => {
            error.innerText = "";
        });

        document.querySelectorAll("input,select").forEach(field => {
            field.classList.remove("error-input");
        });
    }

    function validateForm() {

        clearErrors();

        let valid = true;

        const sku = document.getElementById("sku").value.trim();
        const size = document.getElementById("size").value;
        const concentration = document.getElementById("concentration").value;
        const stock = document.getElementById("stock").value;
        const price = document.getElementById("price").value;
        const salePrice = document.getElementById("salePrice").value;
        const weight = document.getElementById("weight").value;

        if (!sku) {
            showError("sku", "skuError", "SKU is required");
            valid = false;
        } else if (!/^[A-Za-z0-9-]+$/.test(sku)) {
            showError("sku", "skuError", "Invalid SKU");
            valid = false;
        }

        if (!size || Number(size) <= 0) {
            showError("size", "sizeError", "Enter valid size");
            valid = false;
        }

        if (!concentration) {
            showError("concentration", "concentrationError", "Select concentration");
            valid = false;
        }

        if (!stock || Number(stock) < 0) {
            showError("stock", "stockError", "Enter valid stock");
            valid = false;
        }

        if (!price || Number(price) <= 0) {
            showError("price", "priceError", "Enter valid price");
            valid = false;
        }

        if (salePrice !== "") {

            if (Number(salePrice) < 0) {
                showError("salePrice", "salePriceError", "Invalid sale price");
                valid = false;
            }

            if (Number(salePrice) > Number(price)) {
                showError("salePrice", "salePriceError", "Sale price must be less than price");
                valid = false;
            }

        }

        if (!weight || Number(weight) <= 0) {
            showError("weight", "weightError", "Enter valid weight");
            valid = false;
        }

       const existingImages =
    document.querySelectorAll(".existing-images .image-box").length;

const imageCount = existingImages + selectedImages.length;

        if (imageCount < 3 || imageCount > 5) {

            Swal.fire({
                icon: "error",
                title: "Images Required",
                text: "Upload minimum 3 and maximum 5 images.",
                confirmButtonColor: "#096DB9"
            });

            valid = false;
        }

        return valid;

    }
       const dt = new DataTransfer();


   form.addEventListener("submit", e => {

    if (!validateForm()) {
        e.preventDefault();
        return;
    }

    dt.items.clear();

    selectedImages.forEach(file => {
        dt.items.add(file);
    });

    imageInput.files = dt.files;

    isSubmitting = true;


});



let selectedImages = [];
let cropper = null;
let currentFile = null;

browseBtn.addEventListener("click", e => {
    e.stopPropagation();
    imageInput.click();
});
uploadBox.addEventListener("click", () => {
    imageInput.click();
});
uploadBox.addEventListener("dragover", e => {
    e.preventDefault();
    uploadBox.classList.add("drag");
});


uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("drag");
});

uploadBox.addEventListener("drop", e => {
    e.preventDefault();

    uploadBox.classList.remove("drag");

    handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener("change", () => {
    handleFiles(imageInput.files);
});

function handleFiles(files) {

    const fileArray = [...files];

    if (selectedImages.length + fileArray.length > 5) {

        Swal.fire({
            icon: "error",
            title: "Too Many Images",
            text: "Maximum 5 images are allowed.",
            confirmButtonColor: "#096DB9"
        });

        return;
    }

    fileArray.forEach(file => {

        if (!file.type.startsWith("image/")) {

            Swal.fire({
                icon: "error",
                title: "Invalid File",
                text: "Only image files are allowed.",
                confirmButtonColor: "#096DB9"
            });

            return;
        }

        if (file.size > 10 * 1024 * 1024) {

            Swal.fire({
                icon: "error",
                title: "Large File",
                text: "Image should be less than 10 MB.",
                confirmButtonColor: "#096DB9"
            });

            return;
        }

        currentFile = file;

        const reader = new FileReader();

        reader.onload = function (e) {

            cropImage.src = e.target.result;

            cropModal.show();

        };

        reader.readAsDataURL(file);

    });

}

document.getElementById("cropModal").addEventListener("shown.bs.modal", () => {

    if (cropper) {

        cropper.destroy();

    }

    cropper = new Cropper(cropImage, {

        aspectRatio: 1,

        viewMode: 1,

        autoCropArea: 1,

        movable: true,

        zoomable: true,

        scalable: true,

        responsive: true

    });

});

document.getElementById("cropModal").addEventListener("hidden.bs.modal", () => {

    if (cropper) {

        cropper.destroy();

        cropper = null;

    }

});



function renderPreview() {

    previewGrid.innerHTML = "";

    selectedImages.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = function (e) {

            const box = document.createElement("div");

            box.className = "preview-box";

            box.innerHTML = `
                <img src="${e.target.result}">
                <button
                    type="button"
                    class="remove-image"
                    data-index="${index}">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;

            previewGrid.appendChild(box);

        };

        reader.readAsDataURL(file);

    });

}

previewGrid.addEventListener("click", e => {

    const button = e.target.closest(".remove-image");

    if (!button) return;

    const index = Number(button.dataset.index);

    selectedImages.splice(index, 1);

    renderPreview();

});





const cropRotateLeft = document.getElementById("rotateLeft");
const cropRotateRight = document.getElementById("rotateRight");
const cropZoomIn = document.getElementById("zoomIn");
const cropZoomOut = document.getElementById("zoomOut");
const cropReset = document.getElementById("resetCrop");

if (cropRotateLeft) {

    cropRotateLeft.addEventListener("click", () => {

        if (cropper) {

            cropper.rotate(-90);

        }

    });

}

if (cropRotateRight) {

    cropRotateRight.addEventListener("click", () => {

        if (cropper) {

            cropper.rotate(90);

        }

    });

}

if (cropZoomIn) {

    cropZoomIn.addEventListener("click", () => {

        if (cropper) {

            cropper.zoom(0.1);

        }

    });

}

if (cropZoomOut) {

    cropZoomOut.addEventListener("click", () => {

        if (cropper) {

            cropper.zoom(-0.1);

        }

    });

}

if (cropReset) {

    cropReset.addEventListener("click", () => {

        if (cropper) {

            cropper.reset();

        }

    });

}

cropSave.addEventListener("click", () => {

    if (!cropper) {

        return;

    }

    cropper.getCroppedCanvas({

        width: 800,

        height: 800,

        imageSmoothingEnabled: true,

        imageSmoothingQuality: "high"

    }).toBlob(blob => {

        const file = new File(

            [blob],

            `${Date.now()}.jpg`,

            {

                type: "image/jpeg"

            }

        );

        selectedImages.push(file);

        renderPreview();

        cropModal.hide();

        Swal.fire({

            icon: "success",

            title: "Image Added",

            text: "Image cropped successfully.",

            timer: 1200,

            showConfirmButton: false

        });

    }, "image/jpeg", 0.9);

});

document.getElementById("variantForm").addEventListener("reset", () => {

    selectedImages.length = 0;

    previewGrid.innerHTML = "";

    imageInput.value = "";

    document.querySelectorAll(".error").forEach(e => {

        e.innerText = "";

    });

    document.querySelectorAll(".error-input").forEach(e => {

        e.classList.remove("error-input");

    });

});

window.addEventListener("beforeunload", e => {

    if (!isSubmitting && selectedImages.length > 0) {

        e.preventDefault();

        e.returnValue = "";

    }

});

document.querySelectorAll(".deleteVariant").forEach(button => {

    button.addEventListener("click", async function (e) {

        e.preventDefault();

        const id = this.dataset.id;

        const result = await Swal.fire({
            title: "Delete Variant?",
            text: "This variant will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete"
        });

        if (!result.isConfirmed) return;

        try {

            const response = await fetch(`/admin/variant/${id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (data.success) {

                await Swal.fire({
                    icon: "success",
                    title: data.message,
                    timer: 1200,
                    showConfirmButton: false
                });

                location.reload();

            } else {

                Swal.fire(
                    "Error",
                    data.message,
                    "error"
                );

            }

        } catch (err) {

            Swal.fire(
                "Error",
                "Something went wrong.",
                "error"
            );

        }

    });

});

const previewModal = new bootstrap.Modal(
    document.getElementById("imagePreviewModal")
);

const previewImage =
    document.getElementById("previewModalImage");

document.querySelectorAll(".previewImage").forEach(img => {

    img.addEventListener("click", () => {

        previewImage.src = img.src;

        previewModal.show();

    });

});

document.querySelectorAll(".removeExistingImage").forEach(button => {

    button.addEventListener("click", function () {

        this.closest(".image-box").remove();

    });

});

});
