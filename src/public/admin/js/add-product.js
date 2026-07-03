document.addEventListener("DOMContentLoaded", () => {

     console.log('clicked');
const variants = [];




function validateProductForm() {

    let valid = true;

    document.querySelectorAll(".error").forEach(error => {
        error.style.display = "none";
        error.innerText = "";
    });

    document.querySelectorAll("input,select,textarea").forEach(field => {
        field.classList.remove("error-input");
    });

    function showError(fieldId, errorId, message) {

        document.getElementById(fieldId).classList.add("error-input");

        const error = document.getElementById(errorId);

        error.innerText = message;

        error.style.display = "block";

        valid = false;
    }

    const name = document.getElementById("name").value.trim();

    if (!name) {

        showError("name","nameError","Product name is required");

    } else if (name.length < 3) {

        showError("name","nameError","Minimum 3 characters");

    }

    const brand = document.getElementById("brand").value;

if (!brand) {
    showError("brand", "brandError", "Brand is required");
}
    if (!document.getElementById("category").value) {

        showError("category","categoryError","Select category");

    }

    if (!document.getElementById("occasion").value) {

        showError("occasion","occasionError","Select occasion");

    }

    const description = document.getElementById("description").value.trim();

    if (!description) {

        showError("description","descriptionError","Description is required");

    } else if (description.length < 20) {

        showError("description","descriptionError","Minimum 20 characters");

    }

    if (!document.getElementById("topNotes").value.trim()) {

        showError("topNotes","topNotesError","Top notes are required");

    }

    if (!document.getElementById("heartNotes").value.trim()) {

        showError("heartNotes","heartNotesError","Heart notes are required");

    }

    if (!document.getElementById("baseNotes").value.trim()) {

        showError("baseNotes","baseNotesError","Base notes are required");

    }

    return valid;

}
const form = document.getElementById("productForm");

form.addEventListener("submit", function (e) {

    if (!validateProductForm()) {
        e.preventDefault();
    }

});



});