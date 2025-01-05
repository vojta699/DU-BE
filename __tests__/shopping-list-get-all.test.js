const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const ShoppingList = require('../src/db/shopping-list.db');
const User = require('../src/db/user.db');

let mongoServer;
let token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Mock uživatele a token
    const user = await User.create({
        _id: new mongoose.Types.ObjectId(),
        userName: 'test@test.com',
        password: 'test123',
        name: 'test',
        isAdmin: true
    });

    token = jwt.sign(
        { id: user._id, userName: user.userName, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Mock shopping list
    await ShoppingList.create({ name: 'Test List', ownerUserId: user._id });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('GET /shoppingList', () => {
    it('should return a list of shopping lists', async () => {
        const res = await request(app)
            .get('/shoppingList')
            .set('Authorization', `Bearer ${token}`)
            .query({ page: 1, limit: 5 });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toHaveProperty('name', 'Test List');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).get('/shoppingList');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Missing header "Authorization".');
    });

    it('should return 401 for expired or invalid token', async () => {
        const invalidToken = jwt.sign(
            { id: 'invalidId' },
            process.env.JWT_SECRET,
            { expiresIn: '-1s' }
        );

        const res = await request(app)
            .get('/shoppingList')
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is expired.');
    });


    it('should handle invalid token structure gracefully', async () => {
        const res = await request(app)
            .get('/shoppingList')
            .set('Authorization', 'Bearer invalidTokenStructure');

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Wrong authorization.');
    });

    it('should return an empty list if no shopping lists exist', async () => {
        await ShoppingList.deleteMany({});

        const res = await request(app)
            .get('/shoppingList')
            .set('Authorization', `Bearer ${token}`)
            .query({ page: 1, limit: 5 });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveLength(0);
    });
});