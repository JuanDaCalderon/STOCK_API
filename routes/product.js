const express = require('express');
const router = express.Router();

const productController = require('../controllers/product');

router.get('/productos', productController.getProducts);

router.get('/producto/:productId', productController.getProduct);

router.post('/producto', productController.createProduct);

router.put('/producto/:productId', productController.editProduct);

module.exports = router;