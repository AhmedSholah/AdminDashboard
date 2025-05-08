const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddlewar");

const { createStore,editStore,addShippingMethod,getStore,editShippingMethod, deleteShippingMethod } = require('../controllers/storeConfigControllers');
router.post('/create',authMiddleware(), createStore);
router.patch('/edit/:id',authMiddleware(), editStore);
router.post('/:storeId/shipping-method',authMiddleware(), addShippingMethod);
router.get('/:storeId',authMiddleware(), getStore);
router.patch('/:storeId/shipping-method/:methodId', authMiddleware(), editShippingMethod);
router.delete('/:storeId/shipping-method/:methodId', authMiddleware(), deleteShippingMethod);



module.exports = router;
