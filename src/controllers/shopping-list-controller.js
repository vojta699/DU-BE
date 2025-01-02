const listDAO = require('../dao/shopping-list.dao');
const userDAO = require('../dao/user.dao');
const { determineRole } = require('../middleware/authorize-role-request.middleware')
const mongoose = require('mongoose');

const shoppingListController = {
    async create(req, res) {
        try {
            const { name } = req.body;
            const ownerUserId = req.id;
            const shoppingList = await listDAO.create({ name, ownerUserId });
            res.status(201).json({
                status: "success",
                data: shoppingList,
                message: "Shopping list created successfully",
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async list(req, res) {
        try {
            const userId = req.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const shoppingLists = await listDAO.getAll(userId, page, limit);
            res.status(200).json({
                status: "success",
                data: shoppingLists,
                meta: {
                    page,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async get(req, res) {
        try {
            const shoppingList = await listDAO.getById(req.params.id);
            res.status(200).json({
                status: "success",
                data: shoppingList,
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    async delete(req, res) {
        try {
            const shoppingList = await listDAO.deleteById(req.params.id);
            res.status(200).json({
                status: "success",
                data: {},
                message: "Shopping list deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    },

    member: {
        async create(req, res) {
            try {
                const { id } = req.params;
                const { members } = req.body;
                // Získání seznamu a ověření, že přidávaný člen není owner
                const listToUpdate = await listDAO.getById(id);
                if (listToUpdate.ownerUserId === members) {
                    return res.status(400).json({
                        status: "error",
                        message: "Owner cannot be added as a member.",
                    });
                }
                // Ověření existence všech členů v kolekci `users`
                const validMember = await userDAO.findUserById(members);
                if (!validMember) {
                    return res.status(400).json({
                        status: "error",
                        message: "User does not exist.",
                    });
                }
                const shoppingList = await listDAO.addMember(id, members);
                res.status(201).json({
                    status: "success",
                    data: shoppingList,
                    message: "Member added successfully to the list!"
                });
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    message: error.message,
                });
            }
        },

        async delete(req, res) {
            try {
                const { id, idMember } = req.params;
                const userId = req.id;
                const userRole = await determineRole(userId, id);
                const shoppingList = await listDAO.removeMember(id, idMember);
                // Authorizace - člen může odebrat pouze sám sebe
                if (userRole === 'member' && userId !== idMember) {
                    return res.status(403).json({
                        status: "error",
                        message: "Forbidden: Members can only remove themselves.",
                    });
                }
                // Ověření zda se uživatel nachází v daném listu
                if (!shoppingList) {
                    return res.status(400).json({
                        status: "error",
                        message: "Member is not in the list.",
                    });
                }
                res.json({
                    status: "success",
                    data: shoppingList,
                    message: "Member deleted successfully!"
                });
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    message: error.message,
                });
            }
        },
    },

    item: {
        async create(req, res) {
            try {
                const { id } = req.params;
                const { name, status } = req.body;
                const shoppingList = await listDAO.addItem(id, { name, status });
                res.status(201).json({
                    status: "success",
                    data: shoppingList,
                    message: "Item added successfully to the list!"
                });
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    message: error.message,
                });
            }
        },

        async delete(req, res) {
            try {
                const { id, idItem } = req.params;
                const shoppingList = await listDAO.removeItem(id, idItem);
                // Ověření zda se položka nachází v daném listu
                if (!shoppingList) {
                    return res.status(400).json({
                        status: "error",
                        message: "Item does not exist.",
                    });
                }
                res.json({
                    status: "success",
                    data: shoppingList,
                    message: "Item deleted successfully!"
                });
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    message: error.message,
                });
            }
        },

        async update(req, res) {
            try {
                const { id, idItem } = req.params;
                const { status } = req.body;
                const shoppingList = await listDAO.updateItemStatus(id, idItem, status);
                // Ověření zda se položka nachází v daném listu
                if (!shoppingList) {
                    return res.status(400).json({
                        status: "error",
                        message: "Item does not exist.",
                    });
                }
                res.status(200).json({
                    status: "success",
                    data: shoppingList,
                    message: "Item updated successfully!"
                });
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    message: error.message,
                });
            }
        },
    },
};

module.exports = shoppingListController;