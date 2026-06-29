const form = document.getElementById("brandForm");

const name = document.getElementById("name");
const slug = document.getElementById("slug");
const description = document.getElementById("description");
const browseBtn = document.getElementById("browseBtn");
const nameError = document.getElementById("nameError");
const slugError = document.getElementById("slugError");
const descriptionError = document.getElementById("descriptionError");
const placeholder = document.getElementById("placeholder");
const logoInput = document.getElementById("logo");
const preview = document.getElementById("previewImage");
const logoActions = document.getElementById("logoActions");
const removeLogo = document.getElementById("removeLogo");
const removeLogoInput = document.getElementById("removeLogoInput");
const nameRegex = /^[A-Za-z\s]+$/;

function clearErrors() {
    nameError.textContent = "";
    slugError.textContent = "";
    descriptionError.textContent = "";
}

browseBtn.addEventListener("click", () => {
    logoInput.click();
});

logoInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        previewImage.src = e.target.result;

        previewImage.style.display = "block";

        placeholder.style.display = "none";

        logoActions.style.display = "block";

        removeLogoInput.value = "false";
    };

    reader.readAsDataURL(file);

});

removeLogo.addEventListener("click", () => {

    logoInput.value = "";

    previewImage.src = "";

    previewImage.style.display = "none";

    placeholder.style.display = "flex";

    logoActions.style.display = "none";

    removeLogoInput.value = "true";

});

function validate() {

    clearErrors();

    let valid = true;

    if (name.value.trim().length < 4) {
        nameError.textContent = "Minimum 4 characters required.";
        valid = false;
    } else if (!nameRegex.test(name.value.trim())) {
        nameError.textContent = "Only letters are allowed.";
        valid = false;
    }

    if (slug.value.trim().length < 4) {
        slugError.textContent = "Minimum 4 characters required.";
        valid = false;
    }

    if (description.value.trim().length < 4) {
        descriptionError.textContent = "Minimum 4 characters required.";
        valid = false;
    }

    return valid;
}

form.addEventListener("submit", function(e){

    if(!validate()){
        e.preventDefault();
    }

});

name.addEventListener("input", function(){

    this.value = this.value.replace(/[^A-Za-z\s]/g,"");

});

name.addEventListener("input", function(){

    slug.value = this.value
        .toLowerCase()
        .trim()
        .replace(/\s+/g,"-")
        .replace(/[^a-z0-9-]/g,"");

});

logoInput.addEventListener("change",function(){

    const file = this.files[0];

    if(file){

        const reader = new FileReader();

        reader.onload = function(e){

            preview.src = e.target.result;

        }

        reader.readAsDataURL(file);

    }

});