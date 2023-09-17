exports.getErrorPage = (req, res, next) => {
  res.status(404).render("error-page", {
    isAuthenticated: req.session.isLoggedIn,
    docTitle: "Page Not Found",
    path: null,
  });
};
exports.get500ErrorPage = (req, res, next) => {
  res.status(500).render("500", {
    isAuthenticated: req.session.isLoggedIn,
    docTitle: "Something went wrong",
    path: null,
  });
};
