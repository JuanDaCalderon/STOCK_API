const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const { body, param } = require('express-validator');

const saleController = require('../controllers/sale');

router.get('/ventas', isAuth, saleController.getSales);

router.get('/venta', isAuth, saleController.getSale);

router.get('/venta/productos', isAuth, saleController.getProductsSale);

router.post('/venta', isAuth,
    body('correoCliente').isEmail().withMessage('Formato de email del cliente invalido'),
    body('nombreCliente').isLength({ min: 12 }).withMessage('El nombre del cliente debe tener minimo 12 caracteres'),
    saleController.createSale);

module.exports = router;