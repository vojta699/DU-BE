const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const ShoppingList = require('../src/db/shopping-list.db');
const User = require('../src/db/user.db');

let mongoServer;
let tokenMember;
let tokenVisitor;
let listId;
let itemId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Mock uživatele s rolí 'member'
    const userMember = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'test@test.com',
        password: 'test123',
        name: 'test',
        isAdmin: false
    });

    tokenMember = jwt.sign(
        { id: userMember._id, userName: userMember.userName, name: userMember.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock uživatele s rolí 'visitor'
    const visitorUser = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'visitor@test.com',
        password: 'visitor123',
        name: 'visitor',
        isAdmin: false
    });

    tokenVisitor = jwt.sign(
        { id: visitorUser._id, userName: visitorUser.userName, name: visitorUser.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock shopping list s položkami
    const shoppingList = await ShoppingList.create({
        name: 'Test List',
        ownerUserId: userMember._id,
        items: [
            { itemId: new mongoose.Types.ObjectId(), name: 'Item 1', status: 'UNSOLVED' },
            { itemId: new mongoose.Types.ObjectId(), name: 'Item 2', status: 'UNSOLVED' }
        ]
    });

    listId = shoppingList._id;
    itemId = shoppingList.items[0].itemId;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('PATCH /shoppingList/:id/items/:idItem', () => {
    it('should update item status to SOLVED successfully', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.items[0].status).toBe('SOLVED');
    });

    it('should update item status to SOLVED successfully', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ status: 'UNSOLVED' });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.items[0].status).toBe('UNSOLVED');
    });

    it('should return 400 if status is invalid (not in SOLVED or UNSOLVED)', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ status: 'INVALID_STATUS' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid input data');
    });

    it('should return 400 if item does not exist', async () => {
        const nonExistentItemId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${nonExistentItemId}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Item does not exist.');
    });

    it('should return 404 if shopping list is not found', async () => {
        const nonExistentListId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/shoppingList/${nonExistentListId}/items/${itemId}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('message', 'Shopping list not found');
    });

    it('should return 403 if user role is insufficient (not member or higher)', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', `Bearer ${tokenVisitor}`)
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden: This action requires member privileges.');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .send({ status: 'SOLVED' });

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
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', `Bearer ${invalidToken}`)
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is expired.');
    });

    it('should handle invalid token structure gracefully', async () => {
        const res = await request(app)
            .patch(`/shoppingList/${listId}/items/${itemId}`)
            .set('Authorization', 'Bearer invalidTokenStructure')
            .send({ status: 'SOLVED' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Wrong authorization.');
    });
});