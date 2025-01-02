const listDAO = require('../dao/shopping-list.dao');
const userDAO = require('../dao/user.dao');

// Definice hierarchie rolí
const roleHierarchy = ['visitor', 'member', 'owner', 'admin'];

// Funkce na dynamické určení role
async function determineRole(userId, listId) {
    const list = await listDAO.getById(listId);
    const user = await userDAO.findUserById(userId);
    // Ověření existence daného listu + přiřazení role
    if (!list) {
        const error = new Error('Shopping list not found');
        error.statusCode = 404; // Přidání vlastního status kódu  
        throw error;
    }
    if (user.isAdmin) return 'admin';
    if (list.ownerUserId === userId) return 'owner';
    if (list.members.includes(userId)) return 'member';
    return 'visitor';
}

// Middleware pro autorizaci role s dědičností
function authorizeRole(requiredRole) {
    return async (req, res, next) => {
        try {
            const listId = req.params.id;
            const userId = req.id;

            // Zjištění role uživatele v daném listu
            const userRole = await determineRole(userId, listId);

            // Zajištění, že uživatel má dostatečnou roli
            if (roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(requiredRole)) {
                return next();
            }
            return res.status(403).json({
                status: 'error',
                message: `Forbidden: This action requires ${requiredRole} privileges.`,
            });
        } catch (error) {
            // Zajištění, že chybu vrátíme s odpovídajícím status kódem
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                status: 'error',
                message: error.message,
            });
        }
    };
}

module.exports = { authorizeRole, determineRole };