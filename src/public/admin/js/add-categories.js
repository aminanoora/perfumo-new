const form = document.getElementById("categoryForm");

const name = document.getElementById("name");
const slug = document.getElementById("slug");
const description = document.getElementById("description");

form.addEventListener("submit",function(e){

    let valid = true;

    clearErrors();
    const alphaRegex = /^[A-Za-z\s-]+$/;

    if(name.value.trim()===""){

        showError(name,"nameError","Category name is required");
        valid=false;

    }else if(name.value.trim().length<3){
        showError(name,"nameError","Category name should be atleast more than 3 charachters");
        valid=false;
    }else if (!alphaRegex.test(name.value.trim())) {
       showError(name, "nameError", "Category name must only contain letters");
       valid = false;
    }


    if(slug.value.trim()===""){

        showError(slug,"slugError","Slug is required");
        valid=false;

    }else if(slug.value.trim().length<3){
        showError(slug,"slugError","Slug name should be atleast more than 3 charachters");
        valid=false;
    }else if (!alphaRegex.test(slug.value.trim())) {
       showError(slug, "slugError", "Slug name must only contain letters");
       valid = false;
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

    document.querySelectorAll("input, textarea").forEach(input=>{

        input.classList.remove("input-error");

    });

}
[name,slug,description].forEach(field=>{

    field.addEventListener("input",function(){

        this.classList.remove("input-error");

        const error=document.getElementById(this.id+"Error");

        if(error){

            error.innerText="";

        }

    });

});