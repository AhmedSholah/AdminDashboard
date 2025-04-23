const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: Number,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        minlength: [3, 'Product name must be at least 3 characters long'],
        maxlength: [100, 'Product name must be less than or equal to 100 characters']
    },
    productImages: {
        type: [String],
        validate: {
            validator: function (val) {
                return val.length <= 4;
            },
            message: 'Maximum 4 images allowed'
        },
        default: []
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [100, 'Price must be at least 100'],
        max: [1000, 'Price must be less than or equal to 1000']
    },
    productDiscount: {
        type: Number,
        min: [0, 'Price must be at least 0'],
        max: [90, 'Price must be less than or equal to 90'],
        default: 0
    },
    inStock: {
        type: Number,
        default: 1
    },
    category: {
        type: String,
        enum: {
            values: ['Bags', 'Frames', 'Accessories', 'Tablecloth', 'Clothes', 'Stocks', 'Gloves'],
            message: '{VALUE} is not a valid category'
        },
        required: [true, 'Product category is required']
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: { 
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

productSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastProduct = await this.constructor.findOne().sort({ productId: -1 });
        this.productId = lastProduct ? lastProduct.productId + 1 : 100;
    }
    next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
