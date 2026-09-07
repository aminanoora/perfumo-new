

import * as  adminService from "../../services/admin/adminService.js";
import * as dashboardService from "../../services/admin/dashboardService.js";

export const loadAdminLogin = (req, res) => {
  res.render("admin/auth/login");
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminService.adminLogin({
      email,
      password
    })
    req.session.admin = {
      id: admin._id,

      email: admin.email,
    };

    return res.json({
      success: true,

      next: "/admin/dashboard",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: error.message,
    });
  }
};

export const adminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData("month");

    res.render("admin/dashboard/dashboard", {
      active: "dashboard",

      ...data,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin");
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData(
      req.query.filter,

      req.query.start,

      req.query.end,
    );

    return res.json({
      success: true,

      ...data,
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,

      message: "Unable to load dashboard",
    });
  }
};

export const adminLogout = (req, res) => {
  delete req.session.admin;

  res.redirect("/admin/login");
};
