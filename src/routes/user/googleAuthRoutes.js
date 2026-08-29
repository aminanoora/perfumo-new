import express from "express";
import passport from "../../config/passport.js";

const router = express.Router();

router.get(
  "/google",
  (req, res, next) => {
    if (req.query.redirect) {
      req.session.returnTo = req.query.redirect;
    }

    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/signin",
  }),
  (req, res) => {
    req.session.user = {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    };

    const redirect = req.session.returnTo || "/";

    delete req.session.returnTo;

    req.session.save(() => {
      res.redirect(redirect);
    });
  },
);

export default router;
