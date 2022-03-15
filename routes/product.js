const express = require('express');
const router = express.Router();

const productController = require('../controllers/product');

router.get('/productos', productController.getProducts);

module.exports = router;