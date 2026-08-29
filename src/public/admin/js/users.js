window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// document.addEventListener(
//   "DOMContentLoaded",
//   () => {

//     const sortSelect =
//     document.getElementById(
//       "sortSelect"
//     );

//     if (sortSelect) {

//       sortSelect.addEventListener(
//         "change",
//         function () {

//           const params =
//           new URLSearchParams(
//             window.location.search
//           );

//           params.set(
//             "sort",
//             this.value
//           );

//           window.location.href =
//           `/admin/users?${params.toString()}`;

//         }
//       );

//     }

//     const filterBtns =
//     document.querySelectorAll(
//       ".filter-btn"
//     );

//     filterBtns.forEach(btn => {

//       btn.addEventListener(
//         "click",
//         () => {

//           const params =
//           new URLSearchParams(
//             window.location.search
//           );

//           params.set(
//             "status",
//             btn.dataset.status
//           );

//           window.location.href =
//           `/admin/users?${params.toString()}`;

//         }
//       );

//     });

//   }
// );
