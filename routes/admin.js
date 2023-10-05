const express = require("express");
const { check, body } = require("express-validator");

const productsContoller = require("../controllers/product");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

//Path Name can be same if the methods r different like GET & POST

// // /addmin/product => POST
router.post(
  "/add-product",
  isAuth,
  [
    body("title").isString().isLength({ min: 4 }).trim(),
    body("imageURL"),
    body("price").isFloat(),
    body("description").trim().isLength({ min: 10, max: 400 }),
  ],
  productsContoller.postProducts
);

// // /addmin/add-product => GET
router.get("/add-product", isAuth, productsContoller.getProductspage);

router.get("/product", productsContoller.getAdminProductsPage);

router.get(
  "/edit-product/:productId",
  isAuth,
  productsContoller.getEditProductPage
);

router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 1 }).trim(),
    body("price").isFloat(),
    body("description").trim().isLength({ min: 10, max: 400 }),
  ],
  isAuth,
  productsContoller.postEditProductPage
);

// router.post("/delete-product", isAuth, productsContoller.deleteProduct); // controling from backend
router.delete(
  "/delete-product/:productId",
  isAuth,
  productsContoller.deleteProduct
); // controling from frontend

module.exports = router;
