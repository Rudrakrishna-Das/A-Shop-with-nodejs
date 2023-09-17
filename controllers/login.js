const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const User = require("../Models/user");

const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "guddudas835@gmail.com",
    pass: "buitdktbaicpjdef",
  },
});

exports.getLoginPage = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("user/login", {
    docTitle: "Login Page",
    path: "/login",
    errorMessage: message,
    oldInput: { email: "", password: "" },
    validationError: [],
  });
};

exports.postLogin = (req, res, next) => {
  // res.setHeader("set-cookie", "isLoggedIn=true");
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("user/login", {
      docTitle: "Login Page",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password },
      validationError: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("user/login", {
          docTitle: "Login Page",
          path: "/login",
          errorMessage: "No user found with this email",
          oldInput: { email: email, password: password },
          validationError: [{ path: "email" }],
        });
      }
      return bcrypt.compare(password, user.password).then((passwordMatch) => {
        if (passwordMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            //we are returning this otherwise also this will go to next line res.redirect('/') then it will give us err "Cannot set headers after they are sent to the client"
            console.log(err);
            res.redirect("/");
          });
        }
        return res.status(422).render("user/login", {
          docTitle: "Login Page",
          path: "/login",
          errorMessage: "Invalid password please check your password",
          oldInput: { email: email, password: password },
          validationError: [{ path: "password" }],
        });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getSighnupPage = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("user/signup", {
    docTitle: "Sgnup Page",
    path: "/signup",
    errorMessage: message,
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationError: [],
  });
};

exports.postSignupPage = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("user/signup", {
      docTitle: "Sgnup Page",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirm_password,
      },
      validationError: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      return transport
        .sendMail({
          to: email,
          from: "shop@node-complete.com",
          subject: "Sighnup success",
          html: "<h1>You successfully signed up</h1>",
        })
        .then(() => console.log("sent mail"))
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("user/reset", {
    docTitle: "Reset Password",
    path: "/reset",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/");
    }

    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No user found with this email");
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // adding 1h with presetn time for validation
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transport.sendMail({
          to: req.body.email,
          from: "shop@node-complete.com",
          subject: "Password Reset",
          html: `
          
          <p>You requested a password reset</p>
          <p>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password</p>
          
          `,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getResetPasswordPage = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      message.length > 0 ? (message = message[0]) : (message = null);
      res.render("user/new-password", {
        docTitle: "Update Password",
        path: "/new-password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const token = req.body.passwordToken;
  const userId = req.body.userId;
  const newPassword = req.body.password;
  let resetPasswordForUser;

  User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetPasswordForUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetPasswordForUser.password = hashedPassword;
      resetPasswordForUser.resetToken = undefined;
      resetPasswordForUser.resetTokenExpiry = undefined;
      return resetPasswordForUser.save();
    })
    .then((result) => {
      console.log("click");
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
