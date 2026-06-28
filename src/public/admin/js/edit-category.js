const form = document.getElementById("categoryForm");

const name = document.getElementById("name");
const slug = document.getElementById("slug");
const description = document.getElementById("description");

const image = document.getElementById("image");
const preview = document.getElementById("previewImage");

image.addEventListener("change",function(){

    if(this.files && this.files[0]){

        preview.src = URL.createObjectURL(this.files[0]);

    }

});

form.addEventListener("submit",function(e){

    let valid=true;

    clearErrors();

    const alphaRegex=/^[A-Za-z\s-]+$/;

    if(name.value.trim()===""){

        showError(name,"nameError","Category name is required");

        valid=false;

    }else if(name.value.trim().length<3){

        showError(name,"nameError","Minimum 3 characters required");

        valid=false;

    }else if(!alphaRegex.test(name.value.trim())){

        showError(name,"nameError","Only letters are allowed");

        valid=false;

    }

    if(slug.value.trim()===""){

        showError(slug,"slugError","Slug is required");

        valid=false;

    }else if(slug.value.trim().length<3){

        showError(slug,"slugError","Minimum 3 characters required");

        valid=false;

    }

    if(description.value.trim()===""){

        showError(description,"descriptionError","Description is required");

        valid=false;

    }

    if(!valid){

        e.preventDefault();

    }

});

function showError(input,errorId,message){

    input.classList.add("input-error");

    document.getElementById(errorId).innerText=message;

}

function clearErrors(){

    document.querySelectorAll(".error").forEach(error=>{

        error.innerText="";

    });

    document.querySelectorAll("input,textarea").forEach(input=>{

        input.classList.remove("input-error");

    });

}

[name,slug,description].forEach(field=>{

    field.addEventListener("input",function(){

        this.classList.remove("input-error");

        document.getElementById(this.id+"Error").innerText="";

    });

});
const imageInput = document.getElementById("image");
const previewImage = document.getElementById("previewImage");
const removeBtn = document.getElementById("removeImage");
const removeInput = document.getElementById("removeImageInput");

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if(file){

        previewImage.src = URL.createObjectURL(file);

        removeInput.value = "false";

    }

});

removeBtn.addEventListener("click", function(){

    previewImage.src = "/admin/images/no-image.png";

    imageInput.value = "";

    removeInput.value = "true";

});