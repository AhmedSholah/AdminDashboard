const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    minlength: [2, 'Store name must be at least 2 characters'],
    maxlength: [50, 'Store name can\'t be longer than 50 characters'],
  },
  storeURL: {
    type: String,
    required: [true, 'Store URL is required'],
    match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
    maxlength: [200, 'Store URL is too long'], 
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD'], 
  },
  defaultLanguage: {
    type: String,
    required: [true, 'Default language is required'],
    default: 'English',
  },
  shippingMethods: [
    {
      methodName: {
        type: String,
        required: [true, 'Shipping method name is required'],
      },
      cost: {
        type: Number,
        required: [true, 'Shipping cost is required'],
        min: [0, 'Cost must be at least 0'], 
      },
      estimatedDeliveryMin: {
        type: Number,
        required: [true, 'Minimum estimated delivery is required'],
        min: [0, 'Minimum estimated delivery must be at least 0'],
        validate: {
          validator: function(value) {
            return value <= this.estimatedDeliveryMax; 
          },
          message: 'Minimum estimated delivery must be less than or equal to maximum.',
        },
      },
      estimatedDeliveryMax: {
        type: Number,
        required: [true, 'Maximum estimated delivery is required'],
        max: [600, 'Maximum estimated delivery must be at most 600 hours'],
      },
      active: {
        type: Boolean,
        default: true,
      },
      deleted: {
        type: Boolean,
        default: false, 
      },
    },
  ],
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
