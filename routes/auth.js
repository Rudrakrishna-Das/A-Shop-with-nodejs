const express = require("express");
const { check, body } = require("express-validator");

const authControler = require("../controllers/login");
const User = require("../Models/user");

const router = express.Router();

router.get("/login", authControler.getLoginPage);

router.post(
  "/login",
  check("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body(
    "password",
    "Please enter password with alphabets and numbers only with 5 character long"
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  authControler.postLogin
);

router.post("/logout", authControler.postLogout);

router.get("/signup", authControler.getSighnupPage);

router.post(
  "/signup",
  check("email")
    .isEmail()
    .withMessage("Please enter valid Email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Email alredy registered");
        }
      });
    })
    .normalizeEmail(),
  body(
    "password",
    "Please enter password with only numbers and alphabets with minimum 5 character long"
  )
    .trim()
    .isLength({ min: 5 })
    .isAlphanumeric(),
  body("confirm_password")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password have to match");
      }
      return true;
    }),
  authControler.postSignupPage
);

router.get("/reset", authControler.getReset);

router.post("/reset", authControler.postReset);

router.get("/reset/:token", authControler.getResetPasswordPage);

router.post("/new-password", authControler.postNewPassword);

module.exports = router;
