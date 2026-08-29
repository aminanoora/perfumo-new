document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userForm");
  const blockBtn = document.getElementById("blockBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userId = form.dataset.id;

      const formData = new FormData(form);

      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
      };

      try {
        const res = await fetch(`/admin/users/user-details/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "User Updated Successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Something went wrong",
        });
      }
    });
  }

  if (blockBtn) {
    blockBtn.addEventListener("click", async () => {
      const userId = blockBtn.dataset.id;
      const currentBlocked = blockBtn.dataset.blocked === "true";
      const newStatus = !currentBlocked;

      const confirmBox = await Swal.fire({
        title: newStatus ? "Block User?" : "Unblock User?",
        text: newStatus
          ? "User will not be able to access account"
          : "User account will be activated",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: newStatus ? "Block" : "Unblock",
      });

      if (!confirmBox.isConfirmed) return;

      try {
        const res = await fetch(`/admin/users/user-details/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isBlocked: newStatus,
          }),
        });

        const result = await res.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: newStatus ? "User Blocked" : "User Unblocked",
            timer: 1500,
            showConfirmButton: false,
          });

          blockBtn.dataset.blocked = newStatus;

          blockBtn.textContent = newStatus ? "Unblock User" : "Block User";

          const badge = document.querySelector(".status-badge");

          if (badge) {
            badge.textContent = newStatus ? "Blocked" : "Active";

            badge.classList.remove("active", "blocked");

            badge.classList.add(newStatus ? "blocked" : "active");
          }

          updateUsersTable(userId, newStatus);
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Failed to update status",
        });
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const userId = deleteBtn.dataset.id;

      const confirmBox = await Swal.fire({
        title: "Delete User?",
        text: "This action cannot be undone",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
      });

      if (!confirmBox.isConfirmed) return;

      try {
        const res = await fetch(`/admin/users/user-details/${userId}/delete`, {
          method: "POST",
        });

        const result = await res.json();

        if (result.success) {
          await Swal.fire({
            icon: "success",
            title: "User Deleted",
          });

          window.location.href = "/admin/users";
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete failed",
        });
      }
    });
  }

  function updateUsersTable(userId, isBlocked) {
    const row = document.querySelector(`tr[data-id="${userId}"]`);

    if (!row) return;

    row.dataset.status = isBlocked ? "blocked" : "active";

    const statusCell = row.querySelector(".status");

    if (!statusCell) return;

    statusCell.textContent = isBlocked ? "Blocked" : "Active";

    statusCell.classList.remove("active", "blocked");

    statusCell.classList.add(isBlocked ? "blocked" : "active");
  }
});
