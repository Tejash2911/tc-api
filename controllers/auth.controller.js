import { createResetEmailHTML } from "../helpers/orderConfirmation.js";
import sendEmail from "../helpers/sendEmail.js";
import User from "../models/user.model.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/config.js";

export const register = async (req, res) => {
  if (req.body.password.length < 5 || req.body.password.length > 16) {
    return res.status(400).json({ success: false, message: "password length should be in range of 5 to 16 character" });
  }
  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    number: req.body.number,
    password: CryptoJS.AES.encrypt(req.body.password, config.cryptoJsSecretKey.toString()),
    userIP: req.body.userIP,
  });
  try {
    const savedUser = await newUser.save();
    const { password, ...others } = savedUser._doc;

    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        isAdmin: savedUser.isAdmin,
      },
      config.jwtSecretKey,
      { expiresIn: config.jwtSecretExpire || "3d" }
    );

    res.status(201).json({ ...others, accessToken });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "account with this email already exist" });
    } else if (err.name === "ValidationError") {
      if (err.name == "ValidationError") {
        for (field in err.errors) {
          return res.status(400).json({ success: false, message: err.errors[field].message });
        }
      }
    } else {
      console.log(`Logged Error from register user : ${err}`);
      return res.status(500).json({ success: false, message: "internal server error" });
    }
  }
};

export const login = async (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ success: false, message: "please provide email and password" });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ success: false, message: "user with this emil does'nt exist" });
    }

    //checking if this login req is for admin
    if (req.body.forAdmin) {
      if (!user.isAdmin) {
        return res.status(401).json({ success: false, message: "wrong credentials" });
      }
    }

    //matching pass
    const hashedPass = await CryptoJS.AES.decrypt(user.password, config.cryptoJsSecretKey);
    const pass = await hashedPass.toString(CryptoJS.enc.Utf8);
    console.log(`db pass = ${pass}`);
    console.log(`user pass = ${req.body.password}`);
    if (pass !== req.body.password) {
      return res.status(401).json({ success: false, message: "wrong credentials" });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      config.jwtSecretKey,
      { expiresIn: config.jwtSecretExpire || "3d" }
    );

    const { password, resetPasswordToken, resetPasswordExpire, ...others } = user._doc;
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    console.log(`Logged Error from login user : ${err}`);
    return res.status(500).json({
      // Worked
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ success: false, message: "please provide a email" });

  const resetToken = crypto.randomBytes(20).toString("hex");
  const hashedResetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expireDate = Date.now() + 10 * 60000;

  try {
    //finding if user and updating it
    const user = await User.findOneAndUpdate(
      { email: email },
      {
        resetPasswordToken: hashedResetPasswordToken,
        resetPasswordExpire: expireDate,
      }
    );

    if (!user) return res.status(401).json({ success: false, message: "user with this email not exist" });

    //sending email thing
    const resetURl = `${config.frontendUrl}/resetpassword/${resetToken}`;

    const emailText = `
      you have requested a password reset
      please go tho this link to reset password
      ${resetURl}
    `;
    const emailTemplate = createResetEmailHTML(user.firstName, resetURl);
    try {
      sendEmail({
        to: user.email,
        subject: "Forgot Password",
        emailHtml: emailTemplate,
        emailText: emailText,
      });
    } catch (error) {
      //removing users reset token if its not valid
      await User.findOneAndUpdate(
        { email: email },
        {
          resetPasswordToken: undefined,
          resetPasswordExpire: undefined,
        }
      );
      console.log(error);
      return res.status(401).json({ success: false, message: "Failed to send email" });
    }
    res.status(200).json({ success: true, message: "Email send Successfully" });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const resetPassword = async (req, res) => {
  const hashedResetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");
  try {
    //validating if this token is valid or not
    const user = await User.findOne({
      resetPasswordToken: hashedResetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid reset token" });

    //checking if user is entering his old password
    const oldPassHAsh = CryptoJS.AES.decrypt(user.password, config.cryptoJsSecretKey);
    const oldPassword = oldPassHAsh.toString(CryptoJS.enc.Utf8);

    const newPassword = req.body.password;

    if (oldPassword === newPassword) {
      return res.status(401).json({ error: "you can not add your current password" });
    }

    //setting saving new password to mongodb
    user.password = await CryptoJS.AES.encrypt(req.body.password, config.cryptoJsSecretKey.toString());
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ data: "password successfully changed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
