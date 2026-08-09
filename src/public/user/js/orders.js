document.addEventListener("DOMContentLoaded", () => {

    const sortOrders = document.getElementById("sortOrders");

if(sortOrders){

    sortOrders.addEventListener("change",function(){

        window.location.href="/orders?sort="+this.value;

    });

}

    document.querySelectorAll(".cancelOrderBtn").forEach(button=>{

    button.addEventListener("click",async function(){

        const id=this.dataset.id;

        const result=await Swal.fire({

            title:"Cancel Order?",

            text:"Are you sure you want to cancel this order?",

            icon:"warning",

            showCancelButton:true,

            confirmButtonText:"Yes",

            cancelButtonText:"No"

        });

        if(!result.isConfirmed) return;

        const response=await fetch(

            "/orders/"+id+"/cancel",

            {

                method:"PATCH"

            }

        );

        const data=await response.json();

        if(data.success){

            Swal.fire({

                icon:"success",

                title:"Cancelled",

                text:data.message,

                timer:1500,

                showConfirmButton:false

            });

            setTimeout(()=>{

                location.reload();

            },1500);

        }

        else{

            Swal.fire({

                icon:"error",

                title:data.message

            });

        }

    });

});

    document.querySelectorAll(".return-order-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const orderId =
                    button.dataset.id;

                const result =
                    await Swal.fire({

                        title: "Return Order?",

                        text: "Submit a return request?",

                        icon: "question",

                        showCancelButton: true,

                        confirmButtonText: "Submit"

                    });

                if (!result.isConfirmed) return;

                try {

                    const response =
                        await fetch(`/profile/orders/${orderId}/return`, {

                            method: "PATCH"

                        });

                    const data =
                        await response.json();

                    if (data.success) {

                        Swal.fire({

                            icon: "success",

                            title: data.message,

                            timer: 1500,

                            showConfirmButton: false

                        });

                        setTimeout(() => {

                            location.reload();

                        }, 1500);

                    } else {

                        Swal.fire({

                            icon: "error",

                            title: data.message

                        });

                    }

                } catch (error) {

                    Swal.fire({

                        icon: "error",

                        title: "Something went wrong"

                    });

                }

            });

        });

    document.querySelectorAll(".buy-again-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const orderId =
                    button.dataset.id;

                window.location.href =
                    `/profile/orders/${orderId}/buy-again`;

            });

        });

    document.querySelectorAll(".invoice-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const orderId =
                    button.dataset.id;

                window.location.href =
                    `/profile/orders/${orderId}/invoice`;

            });

        });

        if(profileToggle){

    profileToggle.addEventListener('click', (e) => {

        e.preventDefault();

        profileMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {

        if(
            !profileToggle.contains(e.target) &&
            !profileMenu.contains(e.target)
        ){
            profileMenu.classList.remove('show');
        }
    });
}


});