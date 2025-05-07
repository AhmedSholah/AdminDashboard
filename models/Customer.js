const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: Number,
    unique: true,
    required: true,
  },
  customerImage: {
    type: String, 
    required: false,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
    unique: true,
  },
  numberOfOrders: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String], 
    enum: ['premium', 'new customer', 'inactive', 'frequent buyer'],
    default: [],
  }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
