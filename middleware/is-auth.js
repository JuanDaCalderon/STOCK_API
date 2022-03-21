const { response } = require('express');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const { needAuth } = req.query;
    const token = req.get('Authorization');
    if (needAuth) {
        if (needAuth !== null && needAuth !== undefined && needAuth.length > 0) {
            if (needAuth === false || needAuth.toLowerCase() === "false") {
                return next();
            }
        }
    }

    if (!token) {
        return res.status(401).json({
            errors:[{
                msg: 'Se necesita un Authorization-Token para acceder a este recurso'
                }]
        });
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.PRIVATE_KEY);
    }
    catch (error) {
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
    return next();
}