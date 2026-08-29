import * as analyticsService from "../../services/admin/analyticsService.js";

export const loadAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getAnalyticsData({
      page: 1,
      limit: 10,
    });

    res.render("admin/analytics/analytics", {
      active: "analytics",
      ...data,
    });
  } catch (error) {
    console.log(error);

    res.redirect("/admin/dashboard");
  }
};

export const fetchAnalytics = async (req, res) => {
  try {
    const {
      search,
      datePreset,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    const data = await analyticsService.getAnalyticsData({
      search,
      datePreset,
      fromDate,
      toDate,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: "Unable to load analytics",
    });
  }
};

export const exportPdf = async (req, res) => {
  try {
    await analyticsService.exportPdf(req, res);
  } catch (error) {
    console.log(error);

    res.redirect("/admin/analytics");
  }
};

export const exportExcel = async (req, res) => {
  try {
    await analyticsService.exportExcel(req, res);
  } catch (error) {
    console.log(error);

    res.redirect("/admin/analytics");
  }
};
