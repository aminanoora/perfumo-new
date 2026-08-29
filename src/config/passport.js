import passport from "passport";

import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: "/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        if (!user) {
          user = new User({
            firstName: profile.name.givenName,

            lastName: profile.name.familyName,

            email: profile.emails[0].value,

            googleId: profile.id,

            authProvider: "google",

            isVerified: true,
          });

          await user.save();
        }

        if (user.isBlocked) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
