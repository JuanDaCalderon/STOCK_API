const express = require('express');
const router = express.Router();

const branchController = require('../controllers/branch');

router.get('/sucursales', branchController.getBranchs);

module.exports = router;