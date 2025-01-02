const express = require('express')
const router = express.Router()

// MIDDLEWARE
const authorizeRequest = require('../middleware/authorize-request.middleware')
const { authorizeRole } = require('../middleware/authorize-role-request.middleware')
const asyncErrorHandler = require('../middleware/async-error-handler.middleware')

// CONTROLLERS
const userController = require('./user-controller')
const shoppingListController = require('./shopping-list-controller')

// VALIDATION
const validateSchema = require('../middleware/validate-schema.middleware')
const userSchema = require('../models/user.schema')
const shoppingListSchema = require('../models/shopping-list.schema')
const memberSchema = require('../models/member.schema')
const itemSchema = require('../models/item.schema')
const itemStatusSchema = require('../models/itemStatus.chema')

//ENDPOINTS
// User endpoints
router.post(
    "/user/login",
    asyncErrorHandler(userController.login)); // Veřejný přístup
router.post(
    "/user/register",
    validateSchema(userSchema),
    asyncErrorHandler(userController.register)); // Veřejný přístup

// Shopping list endpoints
router.use(authorizeRequest)

router.post(
    "/shoppingList",
    validateSchema(shoppingListSchema),
    asyncErrorHandler(shoppingListController.create)
);
router.get(
    "/shoppingList",
    asyncErrorHandler(shoppingListController.list)
);
router.get(
    "/shoppingList/:id",
    authorizeRole('member'),
    asyncErrorHandler(shoppingListController.get)
);
router.delete(
    "/shoppingList/:id",
    authorizeRole('owner'),
    asyncErrorHandler(shoppingListController.delete)
);
router.post(
    "/shoppingList/:id/members/",
    validateSchema(memberSchema),
    authorizeRole('owner'),
    asyncErrorHandler(shoppingListController.member.create)
);
router.delete(
    "/shoppingList/:id/members/:idMember",
    authorizeRole('member'),
    asyncErrorHandler(shoppingListController.member.delete)
);
router.post(
    "/shoppingList/:id/items/",
    validateSchema(itemSchema),
    authorizeRole('member'),
    asyncErrorHandler(shoppingListController.item.create)
);
router.delete(
    "/shoppingList/:id/items/:idItem",
    authorizeRole('member'),
    asyncErrorHandler(shoppingListController.item.delete)
);
router.patch(
    "/shoppingList/:id/items/:idItem",
    validateSchema(itemStatusSchema),
    authorizeRole('member'),
    asyncErrorHandler(shoppingListController.item.update)
);


module.exports = router