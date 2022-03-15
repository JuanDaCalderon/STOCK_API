const Branch = require('../models/branch');

exports.getBranches = async (req, res, next) => {
    try {
        const sucursales = await Branch.findAll();
        res.json(sucursales);
    } catch (error) {
        console.log(error)
    }
}

exports.getBranch =  async (req, res, next) => {
    const sucursalId = req.params.sucursalId;
    const sucursal = await Branch.findByPk(sucursalId);
    res.json(sucursal);
}

exports.createBranch = async (req, res, next) => {
    const nombre = req.body.nombre; //STRING
    const direccion = req.body.direccion; //STRING
    const telefono = req.body.telefono; //STRING
    try {
        const response = await Branch.create({
            nombre: nombre,
            direccion: direccion,
            telefono: telefono,
            activa: true
        });
        res.json({
            message: 'Sucursal Creada Satisfactoriamente',
            response: response
        });
    } catch (error) {
        console.log(error)
    }
}