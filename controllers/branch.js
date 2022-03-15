const Branch = require('../models/branch');

exports.getBranchs = (req, res, next) => {
    res.status(200).json({title: 'Sucursales'});
}