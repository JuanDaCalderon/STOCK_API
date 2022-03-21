const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
//const { body, param } = require('express-validator');

const productController = require('../controllers/product');
const { body } = require('express-validator');

router.get('/productos', isAuth, productController.getProducts);

router.get('/producto/:productId', isAuth, productController.getProduct);

router.post('/producto', isAuth,
    body('cantidad').isInt().withMessage('El campo "Cantidad" debe ser un numero de tipo Integer'),
    productController.createProduct);

router.put('/producto/:productId', isAuth, productController.editProduct);

router.delete('/producto/:productId', isAuth, productController.deleteProduct);

module.exports = router;