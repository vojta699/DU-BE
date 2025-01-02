const jwt = require('jsonwebtoken')
const userDAO = require('../dao/user.dao')
require('dotenv').config()

const userController = {
  async register(req, res) {
    const { userName, password, name } = req.body
    // Neplatné údaje
    if (!userName || !password || !name) {
      return res.status(401).json({ message: 'Username, name and password have to be specified' })
    }
    try {
      // Kontrola, zda uživatel s tímto jménem již existuje
      const existingUser = await userDAO.findByUserName(userName);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' })
      }
      // Vytvoření nového uživatele
      const newUser = await userDAO.createUser({
        userName,
        password, // Hashování v user.db
        name,
        isAdmin: false,
      });
      // Vytvoření JWT tokenu pro nového uživatele
      const token = jwt.sign(
        {
          userName: newUser.userName,
          name: newUser.name,
          id: newUser._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      res.status(201).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong during registration' })
    }
  },

  async login(req, res) {
    const { userName, password } = req.body;
    if (!userName || !password) return res.status(401).json({ message: 'Username and password have to be specified' })

    try {
      // Najdeme uživatele podle uživatelského jména
      const user = await userDAO.findByUserName(userName)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      // Ověříme, zda heslo odpovídá
      const isMatch = await user.comparePassword(password); // Hashování v user.db
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' })
      }
      // Vytvoříme JWT token
      const token = jwt.sign(
        { userName: user.userName, name: user.name, id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      )
      res.status(200).json({ token })
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong during login' })
    }
  },
};

module.exports = userController