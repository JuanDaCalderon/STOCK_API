/* Express functionality requirements */
const express = require('express');
const router = express.Router();

/* User controller requirement */
const userController = require('../controllers/user');

/* User middlewares */

// 1. READ ALL USERS: GET - http://localhost:9000/usuarios
router.get('/usuarios', userController.getUsers); //HECHO 100%

// 2. READ A USER: GET - http://localhost:9000/usuario/:id
router.get('/usuario/:userId', userController.getUser); //HECHO 100%

// 3. CREATE A USER: POST - http://localhost:9000/usuario
router.post('/usuario', userController.createUser); //HECHO 100%

// 4. AUTHENTICATE A USER: POST - http://localhost:9000/auth
router.post('/auth', userController.authUser); //HECHO 85%

// 5. PASSWORD RECOVERY: PUT - http://localhost:9000/usuario?reset=password
router.put('/usuario', userController.resetUser);

// 6. EDIT A USER: PUT - http://localhost:9000/usuario/:id
router.put('/usuario/:userId', userController.editUser); //HECHO 100%

// 7. DELEATE A USER: DELETE - http://localhost:9000/usuario/:id
router.delete('/usuario/:userId', userController.deleteUser); //HECHO 100%

module.exports = router;



