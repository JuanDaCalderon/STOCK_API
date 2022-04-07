const Branch = require('../models/branch');
const { uploadToBucket } = require('../middleware/s3');
const { validationResult } = require('express-validator');
const validator = require('validator');

exports.getBranches = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    try {
        const sucursales = await Branch.findAndCountAll({
            offset: (currentPage - 1) * perPage,
            limit: perPage
        });
        let totalSucursales = sucursales.count;
        const lastPage = Math.ceil(totalSucursales / perPage);
        if (sucursales == null || sucursales == undefined || sucursales.count <= 0) {
            const error = new Error('No hay sucursales en la base de datos');
            error.statusCode = 404;
            error.data = sucursales;
            throw error;
        } else {
            return res.status(200).json({
                message: 'Sucursales adquiridas correctamente',
                total: totalSucursales,
                current_page: currentPage,
                per_page: perPage,
                last_page: lastPage,
                has_next_page: perPage * currentPage < totalSucursales,
                has_previous_page: currentPage > 1,
                next_page: (currentPage >= lastPage) ? null : currentPage + 1,
                previous_page: (currentPage <= 1) ? null : currentPage - 1,
                from: (currentPage == 1) ? 1 : ((currentPage - 1) * perPage) + 1,
                to: (currentPage == 1) ? perPage : (currentPage == lastPage) ? totalSucursales : ((currentPage - 1) * perPage) + perPage,
                data: sucursales.rows
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.getBranch =  async (req, res, next) => {
    const sucursalId = req.params.sucursalId;
    try {
        const sucursal = await Branch.findByPk(sucursalId);
        if (sucursal) {
            return res.status(200).json({
                message: 'Sucursal adquirida correctamente',
                data: sucursal
            });
        } else {
            const error = new Error('No coincide ninguna sucursal con este id');
            error.statusCode = 404;
            error.data = sucursal;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.createBranch = async (req, res, next) => {
    const {nombre, direccion, telefono} = req.body;
    const errors = validationResult(req);
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 3) {
        return res.status(422).json({
            errors: [{
                message: 'El cuerpo de la petición no debe estar vacío'
            }]
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: [{
                message: 'La validación de los campos fallo',
                data: errors.array()
            }]
        });
    }
    try {
        let s3Response = null;
        (req.file) ? s3Response = await uploadToBucket(process.env.AWS_BUCKET, req.file): null
        const response = await Branch.create({
            nombre: nombre.toLowerCase(),
            direccion: direccion.toLowerCase(),
            telefono: telefono.toLowerCase(),
            imagen: (s3Response) ? s3Response.Location : null,
            activa: true
        });
        if (response) {
            return res.status(201).json({
                message: 'Sucursal creada satisfactoriamente',
                data: response
            });
        } else {
            const error = new Error('Error creando la sucursal, intente más tarde');
            error.data = response;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.editBranch = async (req, res, next) => {
    const {nombre, direccion, telefono, activa} = req.body;
    const errors = validationResult(req);
    if (!req.file) {
        if (!Object.keys(req.body).length) {
            return res.status(422).json({
                errors: [{
                    message: 'El cuerpo de la petición no debe estar vacío'
                }]
            });
        }
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: [{
                message: 'La validación de los campos fallo',
                data: errors.array()
            }]
        });
    }

    try {
        const branch = req.branchDoc;
        const errorsVal = [];

        if (nombre !== null && nombre !== undefined && nombre.length > 0) {
            if (validator.isLength(nombre, {
                    min: 7
                })) {
                branch.nombre = nombre;
            } else {
                let error = {
                    data: nombre,
                    message: 'El nombre debe tener mínimo 8 caracteres',
                    param: "nombre",
                    location: "body"
                }
                errorsVal.push(error);
            }
        }
        if (direccion !== null && direccion !== undefined && direccion.length > 0) {
            if (validator.isLength(direccion, {
                    min: 9
                })) {
                branch.direccion = direccion;
            } else {
                let error = {
                    data: direccion,
                    message: 'La dirección debe tener mínimo 10 caracteres',
                    param: "direccion",
                    location: "body"
                }
                errorsVal.push(error);
            }
        }
        if (telefono !== null && telefono !== undefined && telefono.length > 0) {
            if (validator.isLength(telefono, {
                    min: 6
                })) {
                branch.telefono = telefono;
            } else {
                let error = {
                    data: telefono,
                    message: 'El número de teléfono debe contener al menos 7 dígitos',
                    param: "telefono",
                    location: "body"
                }
                errorsVal.push(error);
            }
        }
        if (activa !== null && activa !== undefined) {
            if (validator.isBoolean(activa.toString())) {
                branch.activa = activa;
            } else {
                let error = {
                    data: activa,
                    message: 'El campo "activa" debe ser un boolean',
                    param: "telefono",
                    location: "body"
                }
                errorsVal.push(error);
            }
        }
        let s3Response = null || undefined;
        (req.file) ? s3Response = await uploadToBucket(process.env.AWS_BUCKET, req.file): null
        if (s3Response) {
            branch.imagen = s3Response.Location;
        }
        if (errorsVal.length > 0) {
            const error = new Error();
            error.statusCode = 422;
            error.data = errorsVal;
            throw error;
        }
        const response = await branch.save();
        if (response) {
            return res.status(201).json({
                message: 'Sucursal actualizada correctamente',
                data: response
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

exports.deleteBranch =  async (req, res, next) => {
    const sucursalId = req.params.sucursalId;
    try {
        const sucursal = await Branch.findByPk(sucursalId);
        if (sucursal) {
            const response = await sucursal.destroy();
            if (response) {
                return res.status(200).json({
                    message: 'Sucursal eliminada correctamente',
                    data: response
                });
            }
        }
        else {
            const error = new Error('No coincide ninguna sucursal con este id');
            error.statusCode = 404;
            error.data = sucursal;
            throw error;
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}