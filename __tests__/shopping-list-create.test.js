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
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('POST /shoppingList', () => {
    it('should create a new shopping list for an admin user', async () => {
        const res = await request(app)
            .post('/shoppingList')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Shopping List' });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.message).toBe('Shopping list created successfully');
        expect(res.body.data).toHaveProperty('name', 'New Shopping List');
        expect(res.body.data).toHaveProperty('ownerUserId');
    });

    it('should return 400 if name is not provided', async () => {
        const res = await request(app)
            .post('/shoppingList')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('Invalid input data');
    });

    it('should return 400 for invalid name (not a string)', async () => {
        const res = await request(app)
            .post('/shoppingList')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 12345 });
    
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid input data');
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).post('/shoppingList').send({ name: 'New Shopping List' });
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
            .post('/shoppingList')
            .set('Authorization', `Bearer ${invalidToken}`)
            .send({ name: 'New Shopping List' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token is expired.');
    });

    it('should handle invalid token structure gracefully', async () => {
        const res = await request(app)
            .post('/shoppingList')
            .set('Authorization', 'Bearer invalidTokenStructure')
            .send({ name: 'New Shopping List' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Wrong authorization.');
    });
});