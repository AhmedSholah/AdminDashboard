const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
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
            enum: ["premium", "new customer", "inactive", "frequent buyer"],
            default: [],
        },
        customerNumber: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function (v) {
                    return /^01[0-2,5]{1}[0-9]{8}$/.test(v);
                },
                message: (props) =>
                    `${props.value} is not a valid Egyptian mobile number!`,
            },
        },
    },
    { timestamps: true }
);

const Customer = mongoose.model("VueCustomer", customerSchema);

module.exports = Customer;
