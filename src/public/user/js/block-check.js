if(!window.isLoggedIn) 
{
    console.log("Guest user");
}else{
  const interval = setInterval(async () => {

  try {

    const res = await fetch("/check-block-status");

    const data = await res.json();

    console.log(data);

    if (data.isBlocked === true) {

      clearInterval(interval);

      await Swal.fire({
        icon: "error",
        title: "Account Blocked",
        text: "Your account has been blocked by admin",
        confirmButtonText: "OK",
        allowOutsideClick: false
      });

      window.location.href = "/logout";

    }

  } catch (err) {

    console.log(err);

  }

}, 3000);
}

