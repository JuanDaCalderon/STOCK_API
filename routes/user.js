/* Express functionality requirements */
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

const { body, query } = require('express-validator');

/* User controller requirement */
const userController = require('../controllers/user');

/* User middlewares */

// 1. READ ALL USERS: GET - http://localhost:9000/usuarios
router.get('/usuarios', isAuth, userController.getUsers);

// 2. READ A USER: GET - http://localhost:9000/usuario/:userId
router.get('/usuario/:userId', isAuth, userController.getUser);

// 3. CREATE A USER: POST - http://localhost:9000/usuario
router.post('/usuario',
    body('email').isEmail().withMessage('Formato de Email Invalido').custom(value => {
        return User.findOne({ where: { correo: value }})
        .then(userDoc=>{
            if (userDoc) {
                return Promise.reject('Ya existe un usuario registrado con este correo');
            }
        });
    }),
    body('telefono').isLength({ min: 9 }).withMessage('El número de teléfono debe contener al menos 10 digitos'),
    body('nombre').isLength({ min: 12 }).withMessage('El nombre debe tener minimo 12 caracteres'),
    body('admin').isBoolean().withMessage('El campo "admin" debe ser un boolean'),
    body('genero').custom(value => {
        console.log(value);
        if (value == 'm' || value == 'M') { return true; }
        else if(value == 'f' || value == 'F') { return true; }
        else { throw new Error('El genero debe ser "f" ó "m"'); }
    }),
    userController.createUser);

// 4. AUTHENTICATE A USER: POST - http://localhost:9000/auth
router.post('/auth',
    body('email').isEmail().withMessage('Formato de Email Invalido'),
    userController.authUser);

// 5. PASSWORD RECOVERY: PUT - http://localhost:9000/usuario?reset=password
router.put('/usuario',
    isAuth,
    query('email').isEmail().withMessage('Formato de Email Invalido').custom(value => {
        return User.findOne({ where: { correo: value }})
        .then(userDoc=>{
            if (!userDoc) {
                return Promise.reject('No existe ningún usuario registrado en la base de datos con este correo');
            }
        });
    }),
    userController.resetUser);

// 6. EDIT A USER: PUT - http://localhost:9000/usuario/:userId
router.put('/usuario/:userId',
    isAuth,
    query('recovery').custom(value => {
        if(value === undefined || value.length <= 0){
            throw new Error('El query param "Recovery" debe estar definido');
        }
        else if (value !== false && value.toLowerCase() !== "false") {
            if (value !== true && value.toLowerCase() !== "true") {
                throw new Error('El query param "Recovery" debe ser true o false');
            }
        }
        return true;
    }),
    query('token').custom(value => {
        if(value === undefined || value.length <= 0){
            throw new Error('El query param "Token" debe estar definido');
        }
        return true;
    }),
    userController.editUser);

// 7. DELEATE A USER: DELETE - http://localhost:9000/usuario/:userId
router.delete('/usuario/:userId', isAuth, userController.deleteUser);

module.exports = router;



