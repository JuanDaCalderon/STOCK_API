const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

router.get('/usuarios', userController.getUsers);
router.post('/usuario', userController.postUser);

module.exports = router;