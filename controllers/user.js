/* User model requirement */
const User = require('../models/user');
const Branch = require('../models/branch');

const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
    const users = await User.findAll();
    if (users == null || users == undefined || users.length <= 0) {
        res.status(404).json({
            message: "No hay usuarios en la base de datos",
            response: users
        });
    } else {
        res.status(200).json({
            response: users
        });
    }
}

exports.getUser = async (req, res, next) => {
    const userId = req.params.userId;
    const user = await User.findByPk(userId);
    if (user) {
        res.status(200).json({
            response: user
        });
    } else {
        res.status(404).json({
            message: "No coincide ningun usuario con este id",
            response: user
        });
    }
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
    let hashPassword = await bcrypt.hash("000000", 10);

    if (!Object.keys(req.body).length || Object.keys(req.body).length < 9) {
        res.status(404).json({
            message: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos',
            response: Object.keys(req.body).length
        });
    }
    else {
        const userData = {
            sucursal_id: sucursal,
            cedula: cedula.toLowerCase(),
            correo: email.toLowerCase(),
            celular: telefono.toLowerCase(),
            contraseña: hashPassword,
            nombre: nombre.toLowerCase(),
            genero: genero.toLowerCase(),
            cargo: cargo.toLowerCase(),
            administrador: admin,
            activo: true,
            fecha_nacimiento: fechaNacimiento,
            fecha_salida: null
        }
        const users = await User.findAll();
        if (users == null || users == undefined || users.length <= 0) {
            const createdBranch = await Branch.create({
                nombre: "cambiame",
                direccion: "cambiame",
                telefono: "1234567",
                activa: true
            });
            if (createdBranch) {
                const response = await User.create(userData);
                res.status(201).json({
                    message: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
                    response: response
                });
            }
        } else {
            const response = await User.create(userData);
            res.status(201).json({
                message: 'usuario creado satisfactoriamente (La contraseña debe ser cambiada por el usuario)',
                response: response
            });
        }
    }
}

exports.authUser = async (req, res, next) => {
    const email = req.body.email; //STRING
    const password = req.body.password; //STRING
    const user = await User.findOne({
        where: {
            correo: email.toLowerCase()
        }
    });
    if (user) {
        let authFlag = await bcrypt.compare(password, user.contraseña);
        if (authFlag) {
            res.status(200).json({
                message: "Inicio de sesión exitoso",
                response: user
            });
        } else {
            res.status(404).json({
                message: "Contraseña incorrecta, intente de nuevo",
                response: user.correo
            });
        }
    }
    else{
        res.status(404).json({
            message: "No existe ningún usuario registrado en la base de datos con este correo",
            response: user
        });
    }
}

exports.resetUser = (req, res, next) => {
    res.status(200).json({title: 'RESET USER'});
}

exports.editUser = async(req, res, next) => {
    const userId = req.params.userId; // userId parameter
    const UPDnombre = req.body.nombre; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDcedula = req.body.cedula; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDtelefono = req.body.telefono; //STRING
    const UPDemail = req.body.email; //STRING
    const UPDgenero = req.body.genero; //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDcargo = req.body.cargo; //STRING
    const UPDsucursal = req.body.sucursal; //INT
    const UPDfechaNacimiento = req.body.fechaNacimiento; //STRING - '1999-03-30' - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    const UPDfechaSalida = req.body.fechaSalida; //STRING - '1999-03-30'
    const UPDadmin = req.body.admin; //BOOL
    const UPDactivo = req.body.activo; //BOOL
    let UPDhashPassword = null;
    if (req.body.password !== null && req.body.password !== undefined && req.body.password.length > 0) {
        UPDhashPassword = await bcrypt.hash(req.body.password, 10);
    } //STRING - SI SE ENVIA ES EL MISMO USER DESDE SU PERFIL QUIEN REALIZO LA PETICION
    if (!Object.keys(req.body).length || Object.keys(req.body).length < 7) {
        res.status(404).json({
            message: 'El cuerpo de la peticion no debe estar vacio y debe ser enviados todos los campos minimos',
            response: Object.keys(req.body).length
        });
    }
    else {
        if ((UPDnombre !== null && UPDnombre !== undefined) ||
            (UPDcedula !== null && UPDcedula !== undefined) ||
            (UPDgenero !== null && UPDgenero !== undefined) ||
            (UPDfechaNacimiento !== null && UPDfechaNacimiento !== undefined) ||
            (UPDhashPassword !== null && UPDhashPassword !== undefined)) {
            const user = await User.findByPk(userId);
            user.sucursal_id = UPDsucursal;
            user.cedula = UPDcedula;
            user.correo = UPDemail;
            user.celular = UPDtelefono;
            user.contraseña = UPDhashPassword;
            user.nombre = UPDnombre;
            user.genero = UPDgenero;
            user.cargo = UPDcargo;
            user.administrador = UPDadmin;
            user.activo = UPDactivo;
            user.fecha_nacimiento = UPDfechaNacimiento;
            const response = await user.save();
            if( response ){
                res.status(201).json({
                    message: 'usuario Actualizado correctamente',
                    response: response
                });
            }
            else{
                res.status(404).json({
                    message: 'Error'
                });
            }
        } else {
            const user = await User.findByPk(userId);
            user.sucursal_id = UPDsucursal;
            user.correo = UPDemail;
            user.celular = UPDtelefono;
            user.cargo = UPDcargo;
            user.administrador = UPDadmin;
            user.activo = UPDactivo;
            user.fecha_salida = UPDfechaSalida;
            const response = await user.save();
            if( response ){
                res.status(201).json({
                    message: 'usuario Actualizado correctamente',
                    response: response
                });
            }
            else{
                res.status(404).json({
                    message: 'Error'
                });
            }
        }
    }
}