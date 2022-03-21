const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}

exports.getProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}

exports.createProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}

exports.editProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}