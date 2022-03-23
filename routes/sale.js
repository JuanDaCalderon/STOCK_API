const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const { body } = require('express-validator');

const saleController = require('../controllers/sale');

// 1. READ ALL SALES: GET - http://localhost:9000/api/ventas
router.get('/ventas', isAuth, saleController.getSales);

// 2. GET ONE SALE: GET - http://localhost:9000/api/venta
router.get('/venta', isAuth, saleController.getSale);

// 3. READ ALL PRODUCTS SOLD: GET - http://localhost:9000/api/venta/productos
router.get('/venta/productos', isAuth, saleController.getProductsSale);

// 4. CREATE A SALE: POST - http://localhost:9000/api/venta
router.post('/venta', isAuth,
    body('correoCliente').isEmail().withMessage('Formato de email del cliente invalido'),
    body('nombreCliente').isLength({ min: 12 }).withMessage('El nombre del cliente debe tener minimo 12 caracteres'),
    saleController.createSale);

// 5. DELETE A SALE: DELETE - http://localhost:9000/api/venta
router.delete('/venta/:saleId', isAuth, saleController.deleteSale);

module.exports = router;