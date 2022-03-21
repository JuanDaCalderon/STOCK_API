const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const isAuth = require('../middleware/is-auth');
const { body, param } = require('express-validator');

const productController = require('../controllers/product');
const req = require('express/lib/request');


router.get('/productos', isAuth, productController.getProducts);

router.get('/producto', isAuth, productController.getProduct);

router.post('/producto', isAuth, productController.createProduct);

router.put('/producto/:productId', isAuth,
    param('productId').custom(value => {
        return Product.findByPk(value)
        .then(productDoc=>{
            if (!productDoc) {
                return Promise.reject('No coincide ningun producto con este id');
            }
            req.productDoc = productDoc;
        });
    }),
    productController.editProduct);

router.delete('/producto/:productId', isAuth, productController.deleteProduct);

module.exports = router;