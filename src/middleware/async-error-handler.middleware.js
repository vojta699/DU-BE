module.exports = fn => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (err) {
        console.error(err)
        next(err)
    }
}