import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { sendOTP } from "../../services/mailService.js";
import Wallet from "../../models/Wallet.js";
import generateReferralCode from "../../util/generateReferralCode.js";

export const loadSignup = (req, res) => {
  res.render("user/auth/signup", {
    referralCode: req.query.ref || "",
  });
};
export const loadSignin = (req, res) => {
  res.render("user/auth/signin");
};

export const loadForgotPassword = (req, res) => {
  res.render("user/auth/forgot-password");
};

export const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      referralCode,
    } = req.body;

    if (!firstName) {
      return res.json({
        success: false,
        field: "firstName",
        message: "First name is required",
      });
    }

    if (!lastName) {
      return res.json({
        success: false,
        field: "lastName",
        message: "Last name is required",
      });
    }

    if (!email) {
      return res.json({
        success: false,
        field: "email",
        message: "Email is required",
      });
    }

    if (!phone) {
      return res.json({
        success: false,
        field: "phone",
        message: "Phone number is required",
      });
    }

    if (!password) {
      return res.json({
        success: false,
        field: "password",
        message: "Password is required",
      });
    }

    if (!confirmPassword) {
      return res.json({
        success: false,
        field: "confirmPassword",
        message: "Please confirm your password",
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.json({
        success: false,
        field: "email",
        message: "Email already exists",
      });
    }

    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
      return res.json({
        success: false,
        field: "phone",
        message: "Phone number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpExpiry = Date.now() + 60000;

    req.session.userData = {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      referralCode,
      otp,
      otpExpiry,
    };

    console.log("OTP:", otp);
    console.log("EMAIL:", email);

    sendOTP(email, otp);

    return res.json({
      success: true,
      next: "/verify-otp",
    });
  } catch (error) {
    console.log("SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const userData = req.session.userData;

    if (!userData) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    if (String(userData.otp) !== String(otp)) {
      return res.json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (userData.otpExpiry < Date.now()) {
      return res.json({
        success: false,
        message: "OTP expired",
      });
    }

    const existingEmail = await User.findOne({
      email: userData.email,
    });

    if (existingEmail) {
      return res.json({
        success: false,
        message: "Email already registered",
      });
    }
    let referralCode;
    let exists = true;

    while (exists) {
      referralCode = generateReferralCode();

      exists = await User.findOne({
        referralCode,
      });
    }
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      isVerified: true,
      referralCode,
    });

    await newUser.save();

    await Wallet.create({
      user: newUser._id,
    });

    if (userData.referralCode) {
      const referrer = await User.findOne({
        referralCode: userData.referralCode,
      });

      if (referrer) {
        let referrerWallet = await Wallet.findOne({
          user: referrer._id,
        });

        let newUserWallet = await Wallet.findOne({
          user: newUser._id,
        });

        referrerWallet.balance += 50;

        referrerWallet.transactions.push({
          type: "credit",
          amount: 50,
          reason: "Referral Bonus",
          description: `Referral bonus for inviting ${newUser.firstName}`,
        });

        newUserWallet.balance += 50;

        newUserWallet.transactions.push({
          type: "credit",
          amount: 50,
          reason: "Referral Bonus",
          description: "Signup referral reward",
        });

        await referrerWallet.save();
        await newUserWallet.save();

        newUser.referredBy = referrer._id;
        newUser.isReferralApplied = true;

        await newUser.save();

        await Referral.create({
          referrer: referrer._id,

          referredUser: newUser._id,

          referralCode: userData.referralCode,

          rewardAmount: 50,
        });
      }
    }

    req.session.user = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
    };

    console.log(req.session.user);

    delete req.session.userData;

    return req.session.save((err) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Session failed",
        });
      }

      return res.json({
        success: true,
        next: "/",
      });
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "OTP verification failed",
    });
  }
};
export const signin = async (req, res) => {
  try {
    console.log("Query:", req.query);
    console.log("ReturnTo:", req.session.returnTo);
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    if (user.isBlocked) {
      return res.json({
        success: false,
        message: "Your account has been blocked by admin",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password",
      });
    }

    req.session.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    const redirectUrl = req.query.redirect || req.session.returnTo || "/";
    console.log("Redirect URL:", redirectUrl);

    delete req.session.returnTo;

    console.log(req.session.user);
    return req.session.save((err) => {
      if (err) {
        console.log(err);

        return res.json({
          success: false,
          message: "Session failed",
        });
      }

      return res.json({
        success: true,
        message: "Login successful",
        next: redirectUrl,
      });
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};
export const resendOTP = async (req, res) => {
  try {
    const userData = req.session.userData;

    if (!userData) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000);

    const newExpiry = Date.now() + 60000;

    userData.otp = newOtp;

    userData.otpExpiry = newExpiry;

    req.session.userData = userData;

    sendOTP(userData.email, newOtp);

    console.log("NEW OTP:", newOtp);

    return res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000);

    const resetCodeExpiry = Date.now() + 60000;

    req.session.resetUser = {
      email,
      resetCode,
      resetCodeExpiry,
    };

    await sendOTP(email, resetCode);

    console.log("RESET CODE:", resetCode);

    return res.json({
      success: true,
      next: "/code-reset-password",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { code } = req.body;

    const resetUser = req.session.resetUser;

    if (!resetUser) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    if (String(resetUser.resetCode) !== String(code)) {
      return res.json({
        success: false,
        message: "Invalid code",
      });
    }

    if (resetUser.resetCodeExpiry < Date.now()) {
      return res.json({
        success: false,
        message: "Code expired",
      });
    }

    return res.json({
      success: true,
      next: "/new-password",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Verification failed",
    });
  }
};
export const resendForgotOTP = async (req, res) => {
  try {
    const resetUser = req.session.resetUser;

    if (!resetUser) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000);

    resetUser.resetCode = newOtp;

    resetUser.resetCodeExpiry = Date.now() + 60000;

    req.session.resetUser = resetUser;

    await sendOTP(resetUser.email, newOtp);
    console.log("resend code ", newOtp);
    return res.json({
      success: true,
      message: "New OTP sent",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const resetUser = req.session.resetUser;

    if (!resetUser) {
      return res.json({
        success: false,
        message: "Session expired",
      });
    }

    const user = await User.findOne({
      email: resetUser.email,
    });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    delete req.session.resetUser;

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.json({
      success: false,
      message: "Password reset failed",
    });
  }
};
export const checkBlockStatus = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({
        isBlocked: false,
      });
    }

    const user = await User.findById(req.session.user.id);

    console.log(user?.isBlocked);

    return res.json({
      isBlocked: user?.isBlocked || false,
    });
  } catch (err) {
    console.log(err);

    res.json({
      isBlocked: false,
    });
  }
};
