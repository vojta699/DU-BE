const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const ShoppingList = require('../src/db/shopping-list.db');
const User = require('../src/db/user.db');

let mongoServer;
let tokenOwner;
let tokenMember;
let tokenVisitor;
let listId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Mock uživatele a token pro 'owner'
    const userOwner = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'owner@test.com',
        password: 'test123',
        name: 'owner',
        isAdmin: false
    });

    tokenOwner = jwt.sign(
        { id: userOwner._id, userName: userOwner.userName, name: userOwner.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock uživatele a token pro 'member'
    const userMember = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'member@test.com',
        password: 'test123',
        name: 'member',
        isAdmin: false
    });

    tokenMember = jwt.sign(
        { id: userMember._id, userName: userMember.userName, name: userMember.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock uživatele a token pro 'visitor'
    const userVisitor = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'visitor@test.com',
        password: 'visitor123',
        name: 'visitor',
        isAdmin: false
    });

    tokenVisitor = jwt.sign(
        { id: userVisitor._id, userName: userVisitor.userName, name: userVisitor.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock shopping list
    const shoppingList = await ShoppingList.create({
        name: 'Test List',
        ownerUserId: userOwner._id
    });
    listId = shoppingList._id;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('DELETE /shoppingList/:id', () => {
    it('should return 403 if visitor tries to delete shopping list', async () => {
        const res = await request(app)
            .delete(`/shoppingList/${listId}`)
            .set('Authorization', `Bearer ${tokenVisitor}`);

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden: This action requires owner privileges.');
    });

    it('should return 403 if member tries to delete shopping list', async () => {
        const res = await request(app)
            .delete(`/shoppingList/${listId}`)
            .set('Authorization', `Bearer ${tokenMember}`);

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden: This action requires owner privileges.');
    });

    it('should allow owner to delete shopping list successfully', async () => {
        const res = await request(app)
            .delete(`/shoppingList/${listId}`)
            .set('Authorization', `Bearer ${tokenOwner}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toBe('Shopping list deleted successfully');

        // Ujištění, že list byl opravdu odstraněn
        const deletedList = await ShoppingList.findById(listId);
        expect(deletedList).toBeNull();
    });

    it('should return 404 if shopping list is not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/shoppingList/${nonExistentId}`)
            .set('Authorization', `Bearer ${tokenOwner}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message', 'Shopping list not found');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).delete(`/shoppingList/${listId}`);
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Missing header "Authorization".');
    });

    it('should return 401 for expired token', async () => {
        const invalidToken = jwt.sign(
            { id: 'invalidId' },
            process.env.JWT_SECRET,
            { expiresIn: '-1s' }
        );

        const res = await request(app)
            .delete(`/shoppingList/${listId}`)
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is expired.');
    });

    it('should handle invalid token structure gracefully', async () => {
        const res = await request(app)
            .delete(`/shoppingList/${listId}`)
            .set('Authorization', 'Bearer invalidTokenStructure');

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Wrong authorization.');
    });
});
