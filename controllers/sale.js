const {ventaProducto, ventasTotal} = require('../models/sale');
const Product = require('../models/product');
const Branch = require('../models/branch');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

exports.getSales = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    try {
        const ventas = await ventasTotal.findAndCountAll({
            attributes: {
                exclude: ['sucursal_id', 'user_id']
            },
            include: [
                {
                    model: Branch
                },
                {
                    model: User,
                    attributes: {
                        exclude: ['sucursal_id', 'contraseña', 'reset_token', 'reset_token_expiration']
                    },
                    include: Branch
                }
            ],
            offset: (currentPage - 1) * perPage,
            limit: perPage
        });
        let totalVentas = ventas.count;
        const lastPage= Math.ceil(totalVentas/perPage);
        if (ventas == null || ventas == undefined || ventas.count <= 0) {
            const error = new Error('No hay ventas en la base de datos');
            error.statusCode = 404;
            error.data = ventas;
            throw error;
        } else {
            return res.status(200).json({
                message: 'ventas adquiridas correctamente',
                total: totalVentas,
                current_page: currentPage,
                per_page: perPage,
                last_page: lastPage,
                has_next_page: perPage * currentPage < totalVentas,
                has_previous_page: currentPage > 1,
                next_page: (currentPage >= lastPage) ? null : currentPage + 1,
                previous_page: (currentPage <= 1) ? null : currentPage - 1,
                from: (currentPage == 1) ? 1 : ((currentPage - 1) * perPage) + 1,
                to: (currentPage == 1) ? perPage : (currentPage == lastPage) ? totalVentas : ((currentPage - 1) * perPage) + perPage,
                data: ventas.rows
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.getProductsSale = async (req, res, next) => {
    const { ref_key } = req.query;
    if (!Object.keys(req.query).length) {
        const error = new Error('Los query params de la petición no deben estar vacíos');
        error.statusCode = 422;
        throw error;
    }
    try {
        const productSales = await ventaProducto.findAll({
            attributes: {
                exclude: ['producto_id']
            },
            where: {
                venta_producto_ref_key: ref_key
            },
            include: Product
        });
        if (productSales && productSales.length > 0) {
            return res.status(200).json({
                message: `Productos vendidos correspondientes a la venta: ${ref_key}`,
                data: productSales
            });
        }
        else {
            const error = new Error('No coincide ningún producto con esta ref_key');
            error.statusCode = 402;
            error.data = productSales;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.getSale = async (req, res, next) => {
    const { saleId, ref_key } = req.query;
    let saleProductosByRef = undefined || null;
    let saleProductosById = undefined || null;
    if (!saleId && !ref_key) {
        const error = new Error('No se recibió ningún Sale Id ni tampoco ningún Sale Ref como query param');
        error.statusCode = 422;
        throw error;
    }
    try {
        if (ref_key && ref_key.length > 0) {
            saleProductosByRef = await ventasTotal.findOne({
                where: { venta_producto_ref: ref_key },
                attributes: {
                    exclude: ['sucursal_id', 'user_id']
                },
                include: [Branch, User]
            });
        }
        else if (saleId && saleId.length > 0) {
            saleProductosById = await ventasTotal.findByPk(saleId, {
                attributes: {
                    exclude: ['sucursal_id', 'user_id']
                },
                include: [Branch, User]
            });
        }
        if (saleProductosByRef || saleProductosById) {
            if (saleProductosByRef && !saleProductosById) {
                return res.status(200).json({
                    message: 'Venta adquirida correctamente por ref_key',
                    data: saleProductosByRef
                });
            }
            else {
                return res.status(200).json({
                    message: 'Venta adquirida correctamente por id',
                    data: saleProductosById
                });
            }
        }
        else {
            const error = new Error('No coincide ninguna venta con la Referencia o con el Id');
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

function promeseGetProducts(productos, ref_key) {
    return new Promise((resolve, reject) => {
        const productosToUpdate = [];
        const productSaleObjs = [];
        productos.forEach(element => {
            let cantidad = parseInt(element.cantidad);
            let precioVendido = parseInt(element.precio_vendido);
            Product.findOne({
                where: {
                    id: element.id,
                    referencia: element.referencia
                }
            }).then(product => {
                if (!product) {
                    return reject("No existe en el inventario un producto con esta Referencia o Id");
                }
                else
                {
                    if (cantidad > product.cantidad) {
                        return reject("No existe en el inventario esa cantidad de productos para: " + product.referencia);
                    }
                }
                let productSaleObj = {
                    venta_producto_ref_key: ref_key,
                    producto_id: product.id,
                    cantidad: cantidad,
                    precio_vendido: (precioVendido) ? precioVendido.toString() : product.precio_minimo.toString()
                }
                productosToUpdate.push(product);
                productSaleObjs.push(productSaleObj);
            }).catch(error => {
                return reject(error);
            });
        });
        setTimeout(functioncheckProductArray = () => {
            if (productosToUpdate.length > 0 && productSaleObjs.length > 0) {
                return resolve({productosToUpdate:productosToUpdate, productSaleObjs: productSaleObjs});
            }
            else {
                functioncheckProductArray();
            }
        }, 200)
    });
}

exports.createSale = async (req, res, next) => {
    let hoy = new Date();
    let desface = Math.abs((hoy.getTimezoneOffset())/-60) * 3600000;
    const {nombreCliente, correoCliente, formaPago, sucursal, vendedor, productos} = req.body;
    const errors = validationResult(req);
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 6) {
        const error = new Error('El cuerpo de la petición no debe estar vacío y debe ser enviados todos los campos');
        error.statusCode = 422;
        throw error;
    }
    if (!Array.isArray(productos)) {
        const error = new Error('el campo productos debe ser un Array con los productos comprados');
        error.statusCode = 422;
        error.data = productos;
        throw error;
    }
    if (!errors.isEmpty()) {
        const error = new Error('La validación de los campos fallo');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    try {
        let ref_key = crypto.randomBytes(6).toString('hex');
        let total = 0;
        let nowDate = Date.now() - desface;
        const productObj = await promeseGetProducts(productos, ref_key);
        for (let index = 0; index < productObj.productosToUpdate.length; index++) {
            await productObj.productosToUpdate[index].update({ cantidad: parseInt(productObj.productosToUpdate[index].cantidad) - parseInt(productObj.productSaleObjs[index].cantidad) });
            if (productObj.productosToUpdate[index].cantidad <= 0) {
               await productObj.productosToUpdate[index].update({disponible: false});
            }
        }
        for (let index = 0; index < productObj.productSaleObjs.length; index++) {
            let precioProVendido = (parseInt(productObj.productSaleObjs[index].precio_vendido) * productObj.productSaleObjs[index].cantidad) || 0;
            total = total + precioProVendido;
        }
        const response = await ventaProducto.bulkCreate(productObj.productSaleObjs);
        if (response) {
            const venta = await ventasTotal.create({
                user_id: parseInt(vendedor),
                venta_producto_ref: ref_key,
                sucursal_id: parseInt(sucursal),
                fecha: nowDate,
                forma_pago: formaPago.toLowerCase(),
                nombre_cliente: nombreCliente.toLowerCase(),
                correo_cliente: correoCliente.toLowerCase(),
                total: total
            });
            if (venta) {
                return res.status(200).json({
                    message: 'Venta creada correctamente',
                    data: {
                        nombreCliente: nombreCliente.toLowerCase(),
                        correoCliente: correoCliente.toLowerCase(),
                        formaPago: formaPago.toLowerCase(),
                        sucursal: parseInt(sucursal),
                        vendedor: parseInt(vendedor),
                        total: total,
                        venta: venta
                    }
                });
            }
        }
    }
    catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.deleteSale = async (req, res, next) => {
    const saleId = req.params.saleId;
    try {
        const sale = await ventasTotal.findByPk(saleId);
        if (sale) {
            const response = await sale.destroy();
            if (response) {
                const productSales = await ventaProducto.destroy({
                    where: {
                        venta_producto_ref_key: response.venta_producto_ref
                    }
                });
                if (productSales) {
                    return res.status(200).json({
                        message: 'venta eliminada correctamente',
                        data: response
                    });
                }
                const error = new Error();
                error.data = productSales;
                throw error;
            }
            const error = new Error();
            error.data = response;
            throw error;
        }
        else {
            const error = new Error('No coincide ninguna venta con este id');
            error.statusCode = 404;
            error.data = sale;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}