const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authReq = req.auth_create || false;
    const token = req.get('Authorization');
    if (authReq) {
        return next();
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