/* User model requirement */
const User = require('../models/user');

const bcrypt = require('bcryptjs');

exports.getUsers = (req, res, next) => {
    User.findAll()
    .then(users => {
        res.json(users);
        })
        .catch(err => {
            console.log(err)
        })
}

exports.getUser = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.findByPk(userId);
    res.json(user);
}

exports.createUser = async (req, res, next) => {
    const nombre = req.body.nombre; //STRING
    const cedula = req.body.cedula; //STRING
    const telefono = req.body.telefono; //STRING
    const email = req.body.email; //STRING
    const genero = req.body.genero; //STRING
    const cargo = req.body.cargo; //STRING
    const sucursal = req.body.sucursal; //INT
    const fechaNacimiento = req.body.fechaNacimiento; //STRING - '1999-03-30'
    const admin = req.body.admin; //BOOL
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    try {
        const response = await User.create({
            sucursal_id: sucursal,
            cedula: cedula,
            correo: email.toLowerCase(),
            celular: telefono,
            contraseña: hashPassword,
            nombre: nombre,
            genero: genero,
            cargo: cargo,
            administrador: admin,
            activo: true,
            fecha_nacimiento: fechaNacimiento,
            fecha_salida: null
        });
        res.json({
            message: 'usuario creado satisfactoriamente (Contraseña debe ser cambiada por el usuario)',
            response: response
        });
    } catch (error) {
        console.log(error);
    }
}

exports.authUser = async (req, res, next) => {
    const email = req.body.email; //STRING
    const password = req.body.password; //STRING
    const user = await User.findOne({ where: { correo: email.toLowerCase() } });
    if(user.contraseña !== null){
        let authFlag = await bcrypt.compare(password, user.contraseña);
        if( authFlag ){
            res.json(user);
        }
        else {
            res.json({response:"EL USUARIO NO EXISTE"});
        }
    }
}

exports.resetUser = (req, res, next) => {
    res.status(200).json({title: 'RESET USER'});
}