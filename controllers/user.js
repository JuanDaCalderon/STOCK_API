const User = require('../models/user');

exports.getUsers = (req, res, next) => {
    res.status(200).json({title: 'USERS'});
}

exports.postUser = (req, res, next) => {
    const nombre = req.body.nombre; //STRING
    const cedula = req.body.cedula; //STRING
    const telefono = req.body.telefono; //STRING
    const email = req.body.email; //STRING
    const genero = req.body.genero; //STRING
    const cargo = req.body.cargo; //STRING
    const sucursal = req.body.sucursal; //INT
    const fechaNacimiento = req.body.fechaNacimiento; //STRING - '1999-03-30'
    const admin = req.body.admin; //BOOL
    res.status(201).json({
        message: 'usuario creado satisfactoriamente (Contraseña debe ser cambiada por el usuario)',
        user: { id: Math.random(), nombre: nombre, cedula: cedula, contraseña: '123456'+ Math.random().toString()}
    });
}