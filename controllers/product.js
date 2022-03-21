const Product = require('../models/product');
const Branch = require('../models/branch');
const { validationResult } = require('express-validator');
const validator = require('validator');

exports.getProducts = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    try {
        const productos = await Product.findAndCountAll({
            attributes: {
                exclude: ['contraseña', 'sucursal_id', 'reset_token', 'reset_token_expiration']
            },
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

exports.getProduct = async (req, res, next) => {
    const productId = req.query.productId;
    const productRef = req.query.productRef;
    let productoByRef = undefined || null;
    let productoById = undefined || null;
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    let totalProductos;
    let lastPage;
    if (!productId && !productRef) {
        return res.status(422).json({
            errors: [{
            value: {productId,productRef},
            msg: 'No se recibio ningun Product Id ni tampoco ningun Product Ref'
            }]
        })
    }
    if (productRef && productRef.length > 0) {
        productoByRef = await Product.findAndCountAll({
            where: { referencia: productRef },
            attributes: {
                exclude: ['sucursal_id']
            },
            include: Branch,
            offset: (currentPage - 1) * perPage,
            limit: perPage
        });
        totalProductos = productoByRef.count;
        lastPage= Math.ceil(totalProductos/perPage);
    }
    else if (productId && productId.length > 0) {
        productoById = await Product.findByPk(productId, {
            attributes: {
                exclude: ['sucursal_id']
            },
            include: Branch
        });
    }
    if ((productoByRef && productoByRef.rows.length > 0) || productoById) {
        if (productoByRef && !productoById) {
            if (totalProductos > 1) {
                return res.status(200).json({
                    msg: 'Productos adquirido correctamente por referencia',
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
                    value: productoByRef.rows
                });
            }
            else
            {
                return res.status(200).json({
                    msg: 'Producto adquirido correctamente por referencia',
                    value: productoByRef.rows[0]
                });
            }
        }
        else if (!productoByRef && productoById) {
            return res.status(200).json({
                msg: 'Producto adquirido correctamente por id',
                value: productoById
            });
        }
        else {
            return res.status(200).json({
                msg: 'Producto adquirido correctamente',
                value_productoById: productoById,
                value_productoByRef: productoByRef
            });
        }
    }
    else {
        return res.status(404).json({
            errors: [{
            value: null,
            msg: 'No coincide ningun producto con la Referencia o con el Id'
            }]
        })
    }
}

exports.createProduct = async (req, res, next) => {
    const {nombre, descripcion, cantidad, marca, talla, categoria, sucursal, referencia, precioMinimo} = req.body;
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.body).length,
            msg: 'El cuerpo de la peticion no puede estar vacio y deben ser enviados todos los campos',
            location: "body"
            }]
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

exports.editProduct = async (req, res, next) => {
    const {nombre, descripcion, cantidad, marca, talla, categoria, sucursal, referencia, precioMinimo, disponible} = req.body;
    const errors = validationResult(req);
    console.log(validationResult(req));
    if (!Object.keys(req.body).length) {
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.body).length,
            msg: 'El cuerpo de la peticion no debe estar vacio',
            location: "body"
            }]
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    const product = req.productDoc;
    const errorsVal = [];
    if (nombre !== null && nombre !== undefined && nombre.length > 0) {
        product.nombre = nombre;
    }
    if (descripcion !== null && descripcion !== undefined && descripcion.length > 0) {
        product.descripcion = descripcion;
    }
    if (cantidad !== null && cantidad !== undefined) {
        product.cantidad = cantidad;
    }
    if (marca !== null && marca !== undefined && marca.length > 0) {
        product.marca = marca;
    }
    if (talla !== null && talla !== undefined && talla.length > 0) {
        product.talla = talla;
    }
    if (categoria !== null && categoria !== undefined && categoria.length > 0) {
        product.categoria = categoria;
    }
    if (sucursal !== null && sucursal !== undefined) {
        product.sucursal_id = sucursal;
    }
    if (referencia !== null && referencia !== undefined && referencia.length > 0) {
        product.referencia = referencia;
    }
    if (precioMinimo !== null && precioMinimo !== undefined) {
        product.precio_minimo = parseInt(precioMinimo);
    }
    if (disponible !== null && disponible !== undefined) {
        if (validator.isBoolean(disponible.toString())) { product.disponible = disponible; }
        else {
          let error = {
            value: disponible,
            msg: 'El campo "disponible" debe ser un boolean',
            param: "disponible",
            location: "body"
          }
          errorsVal.push(error);
        }
    }
    if (errorsVal.length > 0) {
        return res.status(422).json({
            errors: errorsVal
        });
    }
    const response = await product.save();
    const recentProduct = await Product.findByPk(response.id, {
        attributes: {
            exclude: ['sucursal_id']
        },
        include: Branch
    });
    if (response && recentProduct) {
        return res.status(201).json({
            msg: 'Producto actualizado correctamente',
            value: recentProduct
        });
    }
    else {
        return res.status(500).json({
            errors: [{
                msg: 'Error intentando actualizar el producto',
                value: recentProduct
            }]
        });
    }
}

exports.deleteProduct = async(req, res, next) => {
    const productId = req.params.productId;
    const producto = await Product.findByPk(productId);
    if (producto) {
        const response = await producto.destroy();
        if (response) {
            return res.status(200).json({
                msg: 'Producto Eliminado correctamente',
                value: response
            });
        }
    }
    else {
        return res.status(404).json({
            errors: [{
            value: producto,
            msg: 'No coincide ningún producto con este id'
            }]
        });
    }
}