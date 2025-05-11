const mongoose = require('mongoose');
const Joi = require('joi');

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    
    minlength: [2, 'Store name must be at least 2 characters'],
    maxlength: [50, 'Store name can\'t be longer than 50 characters'],
  },
  storeURL: {
    type: String,
   
    match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
  },
  currency: {
    type: String,
   
    default: 'USD',
  },
  defaultLanguage: {
    type: String,
  
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
        min: [200, 'Cost must be at least 0'],
      },
      estimatedDeliveryMin: {
        type: Number,
        required: [true, 'Minimum estimated delivery is required'],
        min: [200, 'Minimum estimated delivery must be at least 200 hours'],
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

const validateStore = (store) => {
  const schema = Joi.object({
    storeName: Joi.string().min(2).max(100).messages({
      'string.base': 'Store name must be a string',
      'string.empty': 'Store name is required',
      'string.min': 'Store name must be at least 2 characters',
      'string.max': 'Store name cannot exceed 100 characters',
    }),
    storeURL: Joi.string().uri().messages({
      'string.uri': 'Store URL must be a valid URI',
      'any.required': 'Store URL is required',
    }),
    currency: Joi.string().messages({
      'string.base': 'Currency must be a string',
      'string.empty': 'Currency is required',
    }),
    defaultLanguage: Joi.string().messages({
      'string.base': 'Language must be a string',
      'string.empty': 'Language is required',
    }),
    shippingMethods: Joi.array().items(Joi.object({
      methodName: Joi.string().required(),
      cost: Joi.number().required().min(0),
      estimatedDeliveryMin: Joi.number().required().min(0),
      estimatedDeliveryMax: Joi.number().required().min(0),
      active: Joi.boolean(),
    })),
  });

  return schema.validate(store, { abortEarly: false });
};

module.exports = { Store, validateStore };
