const express = require('express');
const router = express.Router();

const saleController = require('../controllers/sale');

router.get('/ventas', saleController.getSales);

module.exports = router;