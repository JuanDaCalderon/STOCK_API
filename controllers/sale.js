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
        if (ventas == null || ventas == undefined || ventas.length <= 0) {
            return res.status(404).json({
                errors: [{
                    value: ventas,
                    msg: 'No hay ventas en la base de datos'
                }]
            });
        }
        else {
            return res.status(200).json({
                msg: 'ventas adquiridas correctamente',
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
                value: ventas.rows
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            errors: [{
                value: error,
                msg: 'Error intentando traer las ventas'
            }]
        });
    }
}

exports.getProductsSale = async (req, res, next) => {
    const { ref_key } = req.query;
    if (!Object.keys(req.query).length) {
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.query).length,
            msg: 'Los query params de la peticion no debe estar vacio',
            location: "query"
            }]
        });
    }
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
            msg: `Productos vendidos correspondientes a la venta: ${ref_key}`,
            value: productSales
        });
    }
    else {
        return res.status(404).json({
            errors: [{
                value: productSales,
                msg: 'No coincide ningun producto con esta ref_key'
            }]
        });
    }
}

exports.getSale = async (req, res, next) => {
    const { saleId, ref_key } = req.query;
    let saleProductosByRef = undefined || null;
    let saleProductosById = undefined || null;
    if (!saleId && !ref_key) {
        return res.status(422).json({
            errors: [{
                value: {
                    saleId,
                    ref_key
                },
                msg: 'No se recibio ningun Sale Id ni tampoco ningún Sale Ref como query param'
            }]
        })
    }

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
                msg: 'Venta adquirida correctamente por ref_key',
                value: saleProductosByRef
            });
        }
        else /* if (!saleProductosByRef && saleProductosById) */ {
            return res.status(200).json({
                msg: 'Venta adquirida correctamente por id',
                value: saleProductosById
            });
        }
    }
    else {
        return res.status(404).json({
            errors: [{
            value: null,
            msg: 'No coincide ninguna venta con la Referencia o con el Id'
            }]
        })
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
                    return reject("No existe en el inventario un productro con esta Referencia o Id");
                }
                else
                {
                    if (cantidad > product.cantidad) {
                        return reject("No existe en el inventario esa catidad de productos para: " + product.referencia);
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
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.body).length,
            msg: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
            location: "body"
            }]
        });
    }
    if (!Array.isArray(productos)) {
        return res.status(422).json({
            errors:[{
                value: productos,
                msg: 'el campo productos debe ser un Array con los productos comprados',
                location: "body"
            }]
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    let ref_key = await crypto.randomBytes(6).toString('hex');
    try {
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
                    msg: 'Venta creada Correctamente',
                    value: {
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
        return res.status(500).json({
            errors: [{
                value: error,
                msg: 'Error creando la venta, intente mas tarde'
            }]
        });
    }
}

exports.deleteSale = async (req, res, next) => {
    const saleId = req.params.saleId;
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
                    msg: 'venta eliminada correctamente',
                    value: response
                });
            }
            return res.status(500).json({
                msg: 'Error intentando eliminar la venta',
                value: {
                    products_sale: productSales
                }
            });
        }
        return res.status(500).json({
            msg: 'Error intentando eliminar la venta',
            value: {
                sale: response
            }
        });
    }
    else {
        return res.status(404).json({
            errors: [{
            value: sale,
            msg: 'No coincide ninguna venta con este id'
            }]
        });
    }
}