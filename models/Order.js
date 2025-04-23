const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { 
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'canceled', 'delivered', 'shipped'], 
        default: 'pending', 
    },
    orderDate: {
        type: Date,
        required: true, 
    },
    createdAt: {
        type: Date,
        default: Date.now, 
    },
}, { timestamps: true }); 

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
