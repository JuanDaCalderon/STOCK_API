/* Express functionality requirements */
const express = require('express');
const router = express.Router();

/* Branch controller requirement */
const branchController = require('../controllers/branch');

/* Branch middlewares */

// 1. READ ALL BRANCHES: GET - http://localhost:9000/sucursales
router.get('/sucursales', branchController.getBranches);

// 2. READ A BRANCH: GET - http://localhost:9000/sucursal/:id
router.get('/sucursal/:sucursalId', branchController.getBranch);

// 3. CREATE A BRANCH: POST - http://localhost:9000/sucursal
router.post('/sucursal', branchController.createBranch);

module.exports = router;