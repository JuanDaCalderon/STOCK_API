/* Express functionality requirements */
const express = require('express');
const router = express.Router();
const Branch = require('../models/branch');
const isAuth = require('../middleware/is-auth');
const { body, param } = require('express-validator');

/* Branch controller requirement */
const branchController = require('../controllers/branch');
const req = require('express/lib/request');

/* Branch middlewares */

// 1. READ ALL BRANCHES: GET - http://localhost:9000/sucursales
router.get('/sucursales', isAuth, branchController.getBranches);

// 2. READ A BRANCH: GET - http://localhost:9000/sucursal/:id
router.get('/sucursal/:sucursalId', isAuth, branchController.getBranch);

// 3. CREATE A BRANCH: POST - http://localhost:9000/sucursal
router.post('/sucursal',
    isAuth,
    body('telefono').isLength({ min: 6 }).withMessage('El número de teléfono debe contener al menos 7 digitos').custom(value => {
        return Branch.findOne({ where: { telefono: value }})
        .then(branchDoc=>{
            if (branchDoc) {
                return Promise.reject('Ya existe una sucursal con este teléfono');
            }
        });
    }),
    body('nombre').isLength({ min: 7 }).withMessage('El nombre debe tener minimo 8 caracteres').custom(value => {
        return Branch.findOne({ where: { nombre: value }})
        .then(branchDoc=>{
            if (branchDoc) {
                return Promise.reject('Ya existe una sucursal con este nombre');
            }
        });
    }),
    body('direccion').isLength({ min: 9 }).withMessage('La dirección debe tener minimo 10 caracteres').custom(value => {
        return Branch.findOne({ where: { direccion: value }})
        .then(branchDoc=>{
            if (branchDoc) {
                return Promise.reject('Ya existe una sucursal con esta dirección');
            }
        });
    }),
    branchController.createBranch);

// 3. EDIT A BRANCH: PUT - http://localhost:9000/sucursal/:id
router.put('/sucursal/:sucursalId',
    isAuth,
    param('sucursalId').custom(value => {
        return Branch.findByPk(value)
        .then(branchDoc=>{
            if (!branchDoc) {
                return Promise.reject('No coincide ninguna sucursal con este id');
            }
            req.branchDoc = branchDoc;
        });
    }),
    branchController.editBranch);

module.exports = router;