const express = require("express");

const productsController = require("../controllers/product");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", productsController.getShopPage);

router.get("/products", productsController.getUserProductsPage);
router.get("/products/:productId", productsController.getProduct);

router.get("/cart", isAuth, productsController.getCartPage);
router.post("/cart", isAuth, productsController.postCart);
router.post("/cart-delete-item", isAuth, productsController.deleteCartItem);

router.get("/checkout", isAuth, productsController.getCheckout);

router.get("/checkout/success", isAuth, productsController.getCheckoutSuccess);
router.get("/checkout/cancel", isAuth, productsController.getCheckout);

router.get("/order", isAuth, productsController.getOrderPage);

router.get("/order/:orderId", isAuth, productsController.getInvoice);

module.exports = router;
