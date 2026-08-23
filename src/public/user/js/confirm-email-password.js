document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("confirmEmailPasswordForm");

    const password =
        document.getElementById("password");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const passwordError =
        document.getElementById("passwordError");

    const confirmPasswordError =
        document.getElementById("confirmPasswordError");

    const confirmBtn =
        document.getElementById("confirmBtn");

    function showError(input, errorElement, message) {

        input.classList.add("input-error");

        errorElement.textContent = message;

    }


    function clearError(input, errorElement) {

        input.classList.remove("input-error");

        errorElement.textContent = "";

    }



    document
        .querySelectorAll(".toggle-password")
        .forEach(toggle => {

            toggle.addEventListener("click", () => {

                const targetId =
                    toggle.dataset.target;

                const input =
                    document.getElementById(targetId);

                if (!input) return;


                if (input.type === "password") {

                    input.type = "text";

                    toggle.classList.remove("fa-eye");

                    toggle.classList.add("fa-eye-slash");

                } else {

                    input.type = "password";

                    toggle.classList.remove("fa-eye-slash");

                    toggle.classList.add("fa-eye");

                }

            });

        });




    password.addEventListener("input", () => {

        if (password.value.trim() !== "") {

            clearError(
                password,
                passwordError
            );

        }

     

        if (confirmPassword.value.trim() !== "") {

            if (
                password.value !==
                confirmPassword.value
            ) {

                showError(
                    confirmPassword,
                    confirmPasswordError,
                    "Passwords do not match"
                );

            } else {

                clearError(
                    confirmPassword,
                    confirmPasswordError
                );

            }

        }

    });


    confirmPassword.addEventListener("input", () => {

        if (confirmPassword.value.trim() === "") {


            clearError(
                confirmPassword,
                confirmPasswordError
            );

            return;

        }


        if (
            password.value !==
            confirmPassword.value
        ) {

            showError(
                confirmPassword,
                confirmPasswordError,
                "Passwords do not match"
            );

        } else {

            clearError(
                confirmPassword,
                confirmPasswordError
            );

        }

    });



    form.addEventListener("submit", async (e) => {

        e.preventDefault();


        const passwordValue =
            password.value.trim();

        const confirmPasswordValue =
            confirmPassword.value.trim();


        let isValid = true;


      

        if (!passwordValue) {

            showError(
                password,
                passwordError,
                "Please enter your password"
            );

            isValid = false;

        } else {

            clearError(
                password,
                passwordError
            );

        }


     

        if (!confirmPasswordValue) {

            showError(
                confirmPassword,
                confirmPasswordError,
                "Please confirm your password"
            );

            isValid = false;

        } else {

            clearError(
                confirmPassword,
                confirmPasswordError
            );

        }


        

        if (
            passwordValue &&
            confirmPasswordValue &&
            passwordValue !== confirmPasswordValue
        ) {

            showError(
                confirmPassword,
                confirmPasswordError,
                "Passwords do not match"
            );

            isValid = false;

        }


     

        if (!isValid) {

            return;

        }

        confirmBtn.disabled = true;

        confirmBtn.textContent = "Verifying...";


        try {

            const response =
                await fetch(
                    "/profile/confirm-email-password",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        credentials: "same-origin",

                        body: JSON.stringify({
                            password: passwordValue,
                            confirmPassword: confirmPasswordValue
                        })
                    }
                );


            const data =
                await response.json();


            if (data.success) {

                await Swal.fire({
                    icon: "success",
                    title: "Password Verified",
                    text: data.message,
                    timer: 1200,
                    showConfirmButton: false
                });


                window.location.href =
                    data.redirectUrl || "/profile";


            } else {

                Swal.fire({
                    icon: "error",
                    title: "Verification Failed",
                    text: data.message
                });


                confirmBtn.disabled = false;

                confirmBtn.textContent = "Continue";

            }


        } catch (error) {

            console.error(
                "Confirm email password error:",
                error
            );


            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong"
            });


            confirmBtn.disabled = false;

            confirmBtn.textContent = "Continue";

        }

    });

});