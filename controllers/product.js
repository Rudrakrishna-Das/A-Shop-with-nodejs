const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

const { validationResult } = require("express-validator");

const Products = require("../Models/product");
const Order = require("../Models/order");
const fileHelper = require("../util/filehelper");

exports.getProductspage = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "Add Products",
    path: "admin/add-product",
    editing: false,
    validating: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: null,
    validationError: [],
  });
};
exports.postProducts = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Products",
      path: "admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      prod: {
        title,
        description,
        price,
      },
      validating: true,
      errorMessage: errors.array()[0].msg,
      validationError: errors.array(),
    });
  }
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Products",
      path: "admin/add-product",
      editing: false,
      isAuthenticated: req.session.isLoggedIn,
      prod: {
        title,
        description,
        price,
      },
      validating: true,
      errorMessage: "Attached File is not a image",
      validationError: [],
    });
  }

  const imageURL = image.path;

  const product = new Products({
    title: title,
    imageURL: imageURL,
    description: description,
    price: price,
    userId: req.user._id,
  });
  product
    .save()
    .then(() => {
      console.log("added");
      res.redirect("/admin/product");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getShopPage = (req, res, next) => {
  Products.find()
    .then((product) => {
      res.render("user/product-list", {
        prods: product,
        docTitle: "Shop",
        path: "/shop",
        hasProducts: product.length > 0,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getUserProductsPage = (req, res, next) => {
  Products.find()
    .then((product) => {
      res.render("user/products", {
        prods: product,
        docTitle: "Shop",
        path: "/user-products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, nex) => {
  const prodId = req.params.productId;
  Products.findById(prodId)
    .then((product) =>
      res.render("user/productsDetails", {
        prod: product,
        docTitle: product.title,
        path: "/user-products",
        isAuthenticated: req.session.isLoggedIn,
      })
    )

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getAdminProductsPage = (req, res, next) => {
  Products.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        docTitle: "Admin Product Page",
        path: "/admin-products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProductPage = (req, res, next) => {
  const prodId = req.params.productId;

  Products.findById(prodId)
    .then((product) => {
      res.render("admin/edit-product", {
        docTitle: "Edit-Product",
        path: "admin/edit-product",
        editing: true,
        validating: false,
        errorMessage: null,
        prod: product,
        isAuthenticated: req.session.isLoggedIn,
        validationError: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProductPage = (req, res, next) => {
  const prodId = req.body.productId;

  const updatedTitle = req.body.title;
  const updatedImage = req.file;
  const updatedDescription = req.body.description;
  const updatedPrice = req.body.price;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Edit Products",
      path: "admin/edit-product",
      editing: true,
      isAuthenticated: req.session.isLoggedIn,
      prod: {
        title: updatedTitle,
        description: updatedDescription,
        price: updatedPrice,
        _id: prodId,
      },
      validating: true,
      errorMessage: errors.array()[0].msg,
      validationError: errors.array(),
    });
  }
  Products.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      if (updatedImage) {
        fileHelper.deleteFile(product.imageURL);
        // checking if any image uploaded if uploaded then we change else in the database the image will be same
        product.imageURL = updatedImage.path;
      }
      product.price = updatedPrice;
      product.description = updatedDescription;
      return product.save().then((result) => {
        console.log("UPDATED");
        res.redirect("/admin/product");
      });
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCartPage = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("user/cart", {
        docTitle: "Cart",
        path: "/cart",
        productData: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Products.findById(prodId)
    .then((product) => req.user.addToCart(product))
    .then((result) => res.redirect("/cart"))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteCartItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeItemFromCart(prodId)
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Products.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("product not found"));
      }
      fileHelper.deleteFile(product.imageURL);
      return Products.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then((product) => {
      console.log("deleted");
      res.redirect("/admin/product");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });

      order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => res.redirect("/order"))
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrderPage = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      console.log(orders);
      res.render("user/order", {
        docTitle: "Order",
        path: "/order",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("NO Order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoice", invoiceName);

      const pdfDoc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="' + invoiceName + '"'
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.text(
          prod.product.title +
            " - " +
            prod.quantity +
            " x " +
            "$ " +
            prod.product.price
        );
      });

      pdfDoc.text("-----");
      pdfDoc.text("Total Price - $ " + totalPrice);
      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader("Content-Type", "application/pdf");
      //   res.setHeader(
      //     "Content-Disposition",
      //     'attachment; filename="' + invoiceName + '"'
      //   );
      //   res.send(data);
      // });

      // const file = fs.createReadStream(invoicePath);
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   'attachment; filename="' + invoiceName + '"'
      // );
      // file.pipe(res);
    })
    .catch((err) => next(err));
};
