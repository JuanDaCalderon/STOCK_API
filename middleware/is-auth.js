const { response } = require('express');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.get('Authorization');
    if (!token) {
        return res.status(401).json({
            errors:[{
                msg: 'Se necesita un Authorization-Token para acceder a este recurso'
              }]
        });
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'stock_2022_key');
    } catch (error) {
        return res.status(500).json({
            errors:[{
                value: error,
                msg: 'El token suministrado no coincide con el de ningun usuario'
              }]
        });
    }
    if (decodedToken) {
        req.id = decodedToken.id;
    }
    next();
}