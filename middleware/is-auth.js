const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authReq = req.auth_create || false;
    const token = req.get('Authorization');
    if (authReq) {
        return next();
    }
    if (!token) {
        const error = new Error('Se necesita un Authorization-Token para acceder a este recurso');
        error.statusCode = 401;
        throw error;
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.PRIVATE_KEY);
    }
    catch (error) {
        error.message = 'El token suministrado no coincide con el de ningún usuario';
        throw error;
    }
    if (decodedToken) {
        req.id = decodedToken.id;
    }
    return next();
}