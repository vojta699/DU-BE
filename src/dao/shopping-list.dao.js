const ShoppingList = require('../db/shopping-list.db');
const User = require('../db/user.db');

// DAO metody pro shopping listy
const listDAO = {
    async create({ name, ownerUserId }) {
        try {
            const shoppingList = new ShoppingList({ name, ownerUserId });
            return await shoppingList.save();
        } catch (error) {
            throw new Error('Failed to create shopping list: ' + error.message);
        }
    },

    async getAll(userId, page, limit) {
        try {
            const skip = (page - 1) * limit;
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.isAdmin) {
                return await ShoppingList.find()
                    .skip(skip)
                    .limit(limit);
            }
            return await ShoppingList.aggregate([
                {
                    $match: {
                        $or: [
                            { ownerUserId: userId },
                            { members: userId }
                        ]
                    }
                },
                { $skip: skip },
                { $limit: limit }
            ]);
        } catch (error) {
            throw new Error('Failed to fetch shopping lists: ' + error.message);
        }
    },

    async getById(id) {
        try {
            return await ShoppingList.findById(id);
        } catch (error) {
            throw new Error('Failed to fetch shopping list: ' + error.message);
        }
    },

    async deleteById(id) {
        try {
            return await ShoppingList.findByIdAndDelete(id);
        } catch (error) {
            throw new Error('Failed to delete shopping list: ' + error.message);
        }
    },
    // --- MEMBERS ---
    async addMember(id, memberId) {
        try {
            return await ShoppingList.findByIdAndUpdate(
                id,
                { $addToSet: { members: memberId } },
                { new: true }
            );
        } catch (error) {
            throw new Error('Failed to add member: ' + error.message);
        }
    },

    async removeMember(id, memberId) {
        try {
            const updatedList = await ShoppingList.findOneAndUpdate(
                { _id: id, members: memberId },
                { $pull: { members: memberId } },
                { new: true }
            );
            return updatedList;
        } catch (error) {
            throw new Error('Failed to remove member: ' + error.message);
        }
    },
    // --- ITEMS ---
    async addItem(id, { name, status }) {
        try {
            return await ShoppingList.findByIdAndUpdate(
                id,
                { $addToSet: { items: { name, status } } },
                { new: true }
            );
        } catch (error) {
            throw new Error('Failed to add item: ' + error.message);
        }
    },

    async removeItem(id, itemId) {
        try {
            const updatedList = await ShoppingList.findOneAndUpdate(
                { _id: id, 'items.itemId': itemId },
                { $pull: { items: { itemId: itemId } } },
                { new: true }
            );
            return updatedList;
        } catch (error) {
            throw new Error('Failed to remove item: ' + error.message);
        }
    },

    async updateItemStatus(id, itemId, status) {
        try {
            const updatedList = await ShoppingList.findOneAndUpdate(
                { _id: id, 'items.itemId': itemId },
                { $set: { 'items.$.status': status } },
                { new: true }
            );
            return updatedList;
        } catch (error) {
            throw new Error('Failed to update item status: ' + error.message);
        }
    }
};

module.exports = listDAO;