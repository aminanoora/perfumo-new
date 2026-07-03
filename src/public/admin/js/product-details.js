document.addEventListener("DOMContentLoaded", () => {
     const form = document.getElementById("productForm");

    function validateProductForm() {

        let valid = true;

        document.querySelectorAll(".error").forEach(error => {
            error.innerText = "";
            error.style.display = "none";
        });

        document.querySelectorAll("input, select, textarea").forEach(field => {
            field.classList.remove("error-input");
        });

        function showError(fieldId, errorId, message) {

            document.getElementById(fieldId).classList.add("error-input");

            const error = document.getElementById(errorId);

            error.innerText = message;

            error.style.display = "block";

            valid = false;
        }

        const productName = document.getElementById("productName").value.trim();

        if (!productName) {

            showError(
                "productName",
                "productNameError",
                "Product name is required"
            );

        } else if (productName.length < 3) {

            showError(
                "productName",
                "productNameError",
                "Minimum 3 characters required"
            );

        }

        const brand = document.getElementById("brand").value;

        if (!brand) {

            showError(
                "brand",
                "brandError",
                "Brand is required"
            );

        }

        const category = document.getElementById("category").value;

        if (!category) {

            showError(
                "category",
                "categoryError",
                "Category is required"
            );

        }

        const description = document.getElementById("description").value.trim();

        if (!description) {

            showError(
                "description",
                "descriptionError",
                "Description is required"
            );

        } else if (description.length < 20) {

            showError(
                "description",
                "descriptionError",
                "Description must contain at least 20 characters"
            );

        }

        return valid;
    }

    form.addEventListener("submit", function (e) {

        if (
            e.submitter &&
            (
                e.submitter.classList.contains("list-btn") ||
                e.submitter.classList.contains("delete-btn")
            )
        ) {
            return;
        }

        if (!validateProductForm()) {
            e.preventDefault();
        }

    });


    document.querySelectorAll(".deleteVariant").forEach(button => {

        button.addEventListener("click", async function () {

            const id = this.dataset.id;

            const result = await Swal.fire({
                title: "Delete Variant?",
                text: "This variant will be soft deleted.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, Delete",
                cancelButtonText: "Cancel"
            });

            if (!result.isConfirmed) return;

            try {

                const response = await fetch(`/admin/variant/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                const data = await response.json();

                if (data.success) {

                    await Swal.fire({
                        icon: "success",
                        title: "Deleted",
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    });

                    location.reload();

                } else {

                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: data.message
                    });

                }

            } catch (err) {

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Something went wrong."
                });

            }

        });

    });

});