const Product = require('../models/product');
const Branch = require('../models/branch');
const { validationResult } = require('express-validator');
const validator = require('validator');

exports.getProducts = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    try {
        const productos = await Product.findAndCountAll({
            include: Branch,
            offset: (currentPage - 1) * perPage,
            limit: perPage
        });
        let totalProductos = productos.count;
        const lastPage= Math.ceil(totalProductos/perPage);
        if (productos == null || productos == undefined || productos.length <= 0) {
            return res.status(404).json({
                errors: [{
                value: productos,
                msg: 'No hay productos en la base de datos'
                }]
            });
        }
        else {
            return res.status(200).json({
                msg: 'Productos adquiridas correctamente',
                total: totalProductos,
                current_page: currentPage,
                per_page: perPage,
                last_page: lastPage,
                has_next_page: perPage * currentPage < totalProductos,
                has_previous_page: currentPage > 1,
                next_page: (currentPage >= lastPage) ? null : currentPage + 1,
                previous_page: (currentPage <= 1) ? null : currentPage - 1,
                from: (currentPage == 1) ? 1 : ((currentPage - 1) * perPage) + 1,
                to: (currentPage == 1) ? perPage : (currentPage == lastPage) ? totalProductos : ((currentPage - 1) * perPage) + perPage,
                value: productos.rows
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            errors: [{
                value: error,
                msg: 'Error intentando traer los productos'
            }]
        });
    }
}

exports.getProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}

exports.createProduct = async (req, res, next) => {
    const {nombre, descripcion, cantidad, marca, talla, categoria, sucursal, referencia, precioMinimo} = req.body;
    const errors = validationResult(req);
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.body).length,
            msg: 'El cuerpo de la peticion no puede estar vacio y deben ser enviados todos los campos',
            location: "body"
            }]
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    const productData = {
        nombre: nombre.toLowerCase(),
        descripcion: descripcion.toLowerCase(),
        cantidad: cantidad,
        marca: marca.toLowerCase(),
        talla: talla.toLowerCase(),
        categoria: categoria.toLowerCase(),
        sucursal_id: sucursal,
        referencia: referencia.toLowerCase(),
        precio_minimo: precioMinimo,
        disponible: true
    }
    try {
        const response = await Product.create(productData);
        const recentProduct = await Product.findByPk(response.id, {
            attributes: {
                exclude: ['sucursal_id']
            },
            include: Branch
        });
        return res.status(201).json({
            msg: 'producto creado satisfactoriamente',
            value: recentProduct,
        });
    }
    catch (error) {
        return res.status(500).json({
            errors: [{
                value: error,
                msg: 'Error intentando crear el producto'
            }]
        });
    }
}

exports.editProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}

exports.deleteProduct = (req, res, next) => {
    res.status(200).json({title: 'Productos'});
}