const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}