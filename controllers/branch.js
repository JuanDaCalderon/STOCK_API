const Branch = require('../models/branch');
const { validationResult } = require('express-validator');
const validator = require('validator');

exports.getBranches = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 1;
    try {
        const sucursales = await Branch.findAndCountAll({offset: (currentPage - 1) * perPage, limit: perPage});
        let totalSucursales = sucursales.count;
        const lastPage= Math.ceil(totalSucursales/perPage);
        if (sucursales == null || sucursales == undefined || sucursales.length <= 0) {
            return res.status(404).json({
                errors: [{
                value: sucursales,
                msg: 'No hay sucursales en la base de datos'
                }]
            });
        }
        else {
            return res.status(200).json({
                msg: 'Sucursales adquiridas correctamente',
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
                value: sucursales.rows
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            errors: [{
                value: error,
                msg: 'Error intentando traer las sucursales'
            }]
        });
    }
}

exports.getBranch =  async (req, res, next) => {
    const sucursalId = req.params.sucursalId;
    const sucursal = await Branch.findByPk(sucursalId);
    if (sucursal) {
        return res.status(200).json({
            msg: 'Sucursal adquirida correctamente',
            value: sucursal
        });
    }
    else {
        return res.status(404).json({
            errors: [{
            value: sucursal,
            msg: 'No coincide ninguna sucursal con este id'
            }]
        });
    }
}

exports.createBranch = async (req, res, next) => {
    const {nombre, direccion, telefono} = req.body;
    const errors = validationResult(req);
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 3) {
        return res.status(422).json({
            errors:[{
            value: Object.keys(req.body).length,
            msg: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
            location: "body"
            }]
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    const response = await Branch.create({
        nombre: nombre.toLowerCase(),
        direccion: direccion.toLowerCase(),
        telefono: telefono.toLowerCase(),
        activa: true
    });
    console.log(response);
    if (response) {
        return res.status(201).json({
            msg: 'Sucursal creada satisfactoriamente',
            value: response
        });
    }
    else {
        return res.status(500).json({
            errors: [{
                value: response,
                msg: 'Error creando la sucursal, intente mas tarde'
            }]
        });
    }
}

exports.editBranch = async (req, res, next) => {
    const {nombre, direccion, telefono, activa} = req.body;
    const errors = validationResult(req);
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
    const branch = req.branchDoc;
    const errorsVal = [];
    if (nombre !== null && nombre !== undefined && nombre.length > 0) {
        if (validator.isLength(nombre, { min: 7 })) { branch.nombre = nombre; }
        else {
            let error = {
            value: nombre,
            msg: 'El nombre debe tener minimo 8 caracteres',
            param: "nombre",
            location: "body"
            }
            errorsVal.push(error);
        }
    }
    if (direccion !== null && direccion !== undefined && direccion.length > 0) {
        if (validator.isLength(direccion, { min: 9 })) { branch.direccion = direccion; }
        else {
            let error = {
            value: direccion,
            msg: 'La dirección debe tener minimo 10 caracteres',
            param: "direccion",
            location: "body"
            }
            errorsVal.push(error);
        }
    }
    if (telefono !== null && telefono !== undefined && telefono.length > 0) {
        if (validator.isLength(telefono, { min: 6 })) { branch.telefono = telefono; }
        else {
            let error = {
            value: telefono,
            msg: 'El número de teléfono debe contener al menos 7 digitos',
            param: "telefono",
            location: "body"
            }
            errorsVal.push(error);
        }
    }
    if (activa !== null && activa !== undefined) {
        if (validator.isBoolean(activa.toString())) { branch.activa = activa; }
        else {
            let error = {
            value: activa,
            msg: 'El campo "activa" debe ser un boolean',
            param: "telefono",
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
    const response = await branch.save();
    if (response) {
        return res.status(201).json({
            msg: 'Sucursal actualizada correctamente',
            value: response
        });
    }
    else {
        return res.status(500).json({
            errors: [{
                msg: 'Error intentando actualizar la sucursal',
                value: response
            }]
        });
    }
}