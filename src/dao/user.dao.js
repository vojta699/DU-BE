const User = require('../db/user.db');

// DAO metody pro uživatele
const userDAO = {
    async findByUserName(userName) {
        try {
            return await User.findOne({ userName });
        } catch (error) {
            throw new Error('Failed to find user: ' + error.message);
        }
    },

    async createUser(userData) {
        try {
            const newUser = new User(userData);
            await newUser.save();
            return newUser;
        } catch (error) {
            throw new Error('Failed to create user: ' + error.message);
        }
    },

    async findUserById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            throw new Error('Failed to validate users: ' + error.message);
        }
    },
};

module.exports = userDAO;