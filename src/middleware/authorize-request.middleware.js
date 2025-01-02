const jwt = require('jsonwebtoken')

// Middleware pro autorizaci přihlášení uživatele
async function authorizeRequest(req, res, next) {
    const authorizationHeader = req.header('Authorization')
    const apiToken = authorizationHeader ? authorizationHeader.replace(/Bearer\s+/, '') : null

    if (!apiToken) {
        return res.status(401).json({ message: 'Missing header "Authorization".' })
    }

    try {
        const jwtPayload = jwt.verify(apiToken, process.env.JWT_SECRET)
        if (!jwtPayload) {
            res.status(401).json({ message: 'Wrong token.' })
        }
        req.id = jwtPayload.id
        req.userName = jwtPayload.userName
        req.name = jwtPayload.name
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token is expired.' })
        }
        return res.status(401).json({ message: 'Wrong authorization.' })
    }
    return next()
}

module.exports = authorizeRequest