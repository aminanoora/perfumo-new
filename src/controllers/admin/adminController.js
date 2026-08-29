import bcrypt from "bcryptjs";

import Admin from "../../models/Admin.js";

import * as dashboardService from "../../services/admin/dashboardService.js";

export const loadAdminLogin = (req, res) => {
  res.render("admin/auth/login");
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        success: false,

        message: "All fields are required",
      });
    } else if (!email.includes("@")) {
      return res.json({
        success: false,
        message: "Given email is not valid",
      });
    }
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.json({
        success: false,

        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.json({
        success: false,

        message: "Invalid password",
      });
    }

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

      message: "Something went wrong",
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
