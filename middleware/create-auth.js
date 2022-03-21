
module.exports = (req, res, next) => {
    const { needAuth } = req.query;
    req.auth_create = false;
    if (needAuth) {
        if (needAuth !== null && needAuth !== undefined && needAuth.length > 0) {
            if (needAuth === false || needAuth.toLowerCase() === "false") {
                req.auth_create = true;
            }
        }
    }
    return next();
}