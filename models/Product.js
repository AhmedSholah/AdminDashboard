const mongoose = require("mongoose");

// Define combined product schema
const productSchema = new mongoose.Schema(
    {
        productId: {
            type: Number,
            unique: true,
        },
        name: {
            type: String,
            required: [true, "Product name is required"],
            minlength: [3, "Product name must be at least 3 characters long"],
            maxlength: [
                100,
                "Product name must be less than or equal to 100 characters",
            ],
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price must be at least 0"],
            max: [1000000, "Price must be realistic"],
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        productImages: {
            type: [String],
            validate: {
                validator: function (val) {
                    return val.length <= 4;
                },
                message: "Maximum 4 images allowed",
            },
            default: [],
        },
        imageNames: [
            {
                type: String,
            },
        ],
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        productDiscount: {
            type: Number,
            min: [0, "Discount must be at least 0"],
            max: [90, "Discount must be less than or equal to 90"],
            default: 0,
        },
        category: {
            type: mongoose.Schema.Types.Mixed, // supports both ObjectId and string enum
            required: [true, "Product category is required"],
            validate: {
                validator: function (val) {
                    // Allow enum strings or ObjectId references
                    const validCategories = [
                        "Bags",
                        "Frames",
                        "Accessories",
                        "Tablecloth",
                        "Clothes",
                        "Stocks",
                        "Gloves",
                    ];
                    return (
                        mongoose.isValidObjectId(val) ||
                        validCategories.includes(val)
                    );
                },
                message: "{VALUE} is not a valid category",
            },
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            minlength: [1, "Description must be at least 1 characters long."],
            maxlength: [5000, "Description cannot exceed 5000 characters."],
        },
        views: {
            type: Number,
            default: 0,
            min: 0,
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: 0,
        },
        inStock: {
            type: Number,
            default: 1,
        },
        weight: {
            type: Number,
            // required: true,
            min: 0,
        },
        dimensions: {
            type: {
                length: { type: Number, min: 0, required: true },
                width: { type: Number, min: 0, required: true },
                height: { type: Number, min: 0, required: true },
            },
        },
        shippingInfo: {
            type: {
                shippingCost: { type: Number, min: 0, required: true },
                estimatedDelivery: { type: Number, min: 0, required: true },
            },
        },
        soldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Auto-increment productId on creation
productSchema.pre("save", async function (next) {
    if (this.isNew) {
        const lastProduct = await this.constructor
            .findOne()
            .sort({ productId: -1 });
        this.productId = lastProduct ? lastProduct.productId + 1 : 100;
    }
    next();
});

// Virtual: Calculate price after applying discount
productSchema.virtual("priceAfterDiscount").get(function () {
    const calculatedPrice =
        this.price -
        this.discountAmount -
        this.price * (this.discountPercentage / 100);

    return Math.max(calculatedPrice, 0);
});

// Virtual: Images URLs based on imageNames
productSchema.virtual("images").get(function () {
    if (!this.imageNames || this.imageNames.length === 0) {
        return [];
    }
    return this.imageNames.map(
        (imageName) => `${process.env.AWS_S3_PUBLIC_BUCKET_URL}${imageName}`
    );
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
