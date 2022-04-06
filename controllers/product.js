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
        if (productos == null || productos == undefined || productos.count <= 0) {
            const error = new Error('No hay productos en la base de datos');
            error.statusCode = 404;
            error.data = productos;
            throw error;
        }
        else {
            return res.status(200).json({
                message: 'Productos adquiridas correctamente',
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
                data: productos.rows
            });
        }
    }
    catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
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
        const error = new Error('No se recibió ningún Product Id ni tampoco ningún Product Ref');
        error.statusCode = 422;
        throw error;
    }
    try {
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
                        message: 'Productos adquiridos correctamente por referencia',
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
                        data: productoByRef.rows
                    });
                }
                else
                {
                    return res.status(200).json({
                        message: 'Producto adquirido correctamente por referencia',
                        data: productoByRef.rows[0]
                    });
                }
            }
            else if (!productoByRef && productoById) {
                return res.status(200).json({
                    message: 'Producto adquirido correctamente por id',
                    data: productoById
                });
            }
        }
        else {
            const error = new Error('No coincide ningún producto con la Referencia o con el Id');
            error.statusCode = 422;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.createProduct = async (req, res, next) => {
    const {nombre, descripcion, cantidad, marca, talla, categoria, sucursal, referencia, precioMinimo} = req.body;
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
        const error = new Error('El cuerpo de la petición no puede estar vacío y deben ser enviados todos los campos');
        error.statusCode = 422;
        throw error;
    }
    try {
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
        const response = await Product.create(productData);
        const recentProduct = await Product.findByPk(response.id, {
            attributes: {
                exclude: ['sucursal_id']
            },
            include: Branch
        });
        return res.status(201).json({
            message: 'producto creado satisfactoriamente',
            data: recentProduct,
        });
    }
    catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.editProduct = async (req, res, next) => {
    const {nombre, descripcion, cantidad, marca, talla, categoria, sucursal, referencia, precioMinimo, disponible} = req.body;
    const errors = validationResult(req);
    if (!Object.keys(req.body).length) {
        const error = new Error('El cuerpo de la petición no debe estar vacio');
        error.statusCode = 422;
        throw error;
    }
    if (!errors.isEmpty()) {
        const error = new Error('La validación de los campos fallo');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    try {
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
                data: disponible,
                message: 'El campo "disponible" debe ser un boolean',
                param: "disponible",
                location: "body"
            }
            errorsVal.push(error);
            }
        }
        if (errorsVal.length > 0) {
            const error = new Error();
            error.statusCode = 422;
            error.data = errorsVal;
            throw error;
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
                message: 'Producto actualizado correctamente',
                data: recentProduct
            });
        }
        else {
            const error = new Error('Error intentando actualizar el producto');
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.deleteProduct = async(req, res, next) => {
    const productId = req.params.productId;
    const producto = await Product.findByPk(productId);
    try {
        if (producto) {
            const response = await producto.destroy();
            if (response) {
                return res.status(200).json({
                    message: 'Producto Eliminado correctamente',
                    data: response
                });
            }
        }
        else {
            const error = new Error('No coincide ningún producto con este id');
            error.statusCode = 404;
            error.data = producto;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}