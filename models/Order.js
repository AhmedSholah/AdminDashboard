const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { 
        type: Number,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'canceled', 'delivered', 'shipped'], 
        default: 'pending',
        required: true, 
    },
    orderDate: {
        type: Date,
        required: true, 
    },
   
    customerName: {   
        type: String,
        required: false,
    },
    totalPrice: {  
        type: Number,
        required: false,
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      }

}, { timestamps: true }); 

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
