const {ventaProducto, ventasTotal} = require('../models/sale');

exports.getSales = (req, res, next) => {
    res.status(200).json({title: 'Ventas'});
}