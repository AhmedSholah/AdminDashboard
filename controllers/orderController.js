const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

// @desc    Get all orders with optional sorting and filtering by status
// @route   GET /orders
// @access  Public
const getAllOrders = async (req, res) => {
    const {
        sortBy = "createdAt",
        order = "desc",
        status,
        customerName,
        orderDate,
        priceMin,
        priceMax,
        totalPrice,
        orderId,
        shippingAddress,
        paymentInfo,
        limit = 11,
    } = req.query;

    let filter = {};
    const { search } = req.query;

    if (status) {
        filter.status = status;
    }

    if (orderId) {
        filter.orderId = orderId;
    }
    if (orderDate) {
        const parsedOrderDate = new Date(orderDate);
        if (!isNaN(parsedOrderDate)) {
            filter.orderDate = parsedOrderDate;
        } else {
            return res
                .status(400)
                .json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }
    }

    if (customerName) {
        filter.customerName = { $regex: customerName, $options: "i" };
    }

    if (priceMin || priceMax) {
        filter.totalPrice = {};
        if (priceMin) {
            filter.totalPrice.$gte = Number(priceMin);
        }
        if (priceMax) {
            filter.totalPrice.$lte = Number(priceMax);
        }
    }

    if (totalPrice) {
        const parsedTotalPrice = parseFloat(totalPrice);
        if (!isNaN(parsedTotalPrice)) {
            filter.totalPrice = parsedTotalPrice;
        } else {
            return res.status(400).json({ message: "Invalid price format" });
        }
    }

    if (search) {
        filter.$or = [
            { customerName: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { orderId: { $regex: search, $options: "i" } },
            { totalPrice: { $eq: Number(search) } },
        ];
    }

    const limitParam = parseInt(req.query.limit) || 1100;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * limitParam;

    try {
        const totalOrders = await Order.countDocuments(filter);
        const allowedSortFields = [
            "createdAt",
            "orderDate",
            "totalPrice",
            "status",
            "orderId",
        ];
        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const orders = await Order.find(filter)
            .populate("user")
            .populate("products.productId")
            .skip(skip)
            .limit(limitParam)
            .sort({ [sortField]: order === "desc" ? -1 : 1 })
            .exec();

        const totalPages = Math.ceil(totalOrders / limitParam);
        // if (currentPage > totalPages) {
        //     return res.status(404).json({ message: "Page not found" });
        // }

        res.status(200).json({
            orders,
            currentPage: currentPage,
            totalPages,
            totalOrders,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Create a new order
// @route   POST /orders
// @access  Public
const addOrder = async (req, res) => {
    try {
        const {
            orderId,
            orderDate,
            status,
            customer,
            shippingAddress,
            paymentInfo,
            products,
        } = req.body;

        if (
            !orderId ||
            !orderDate ||
            !status ||
            !customer ||
            !shippingAddress ||
            !paymentInfo ||
            !products
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingOrder = await Order.findOne({ orderId });
        if (existingOrder) {
            return res.status(400).json({ message: "Order ID must be unique" });
        }

        const existingCustomer = await Customer.findById(customer);
        if (!existingCustomer) {
            return res.status(400).json({ message: "Customer not found" });
        }

        let totalPrice = 0;
        const updatedProducts = [];
        for (let product of products) {
            const existingProduct = await Product.findById(product.productId);
            if (!existingProduct) {
                return res.status(400).json({
                    message: `Product with ID ${product.productId} not found`,
                });
            }

            updatedProducts.push({
                productId: product.productId,
                quantity: product.quantity,
            });

            totalPrice += existingProduct.price * product.quantity;
        }

        const newOrder = new Order({
            orderId,
            orderDate,
            status,
            customer,
            shippingAddress,
            paymentInfo,
            products: updatedProducts,
            totalPrice,
        });

        await newOrder.save();
        const populatedOrder = await Order.findById(newOrder._id)
            .populate("customer")
            .populate("products.productId");

        res.status(201).json({
            message: "Order created successfully",
            newOrder: populatedOrder,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Update order status by order ID
// @route   PATCH /orders/:id
// @access  Public
const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = [
        "pending",
        "processing",
        "canceled",
        "delivered",
        "shipped",
    ];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: id },
            { status },
            { new: true }
        );
        if (!updatedOrder)
            return res.status(404).json({ message: "Order not found" });

        res.status(200).json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// تحديث order مع إضافة المنتجات الجديدة
const updateOrderWithProducts = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { products } = req.body;

        // Find the order by orderId
        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Add or update products in the order
        for (let newProduct of products) {
            let productExists = false;

            // Check if product already exists in the order
            for (let existingProduct of order.products) {
                if (
                    existingProduct.productId.toString() ===
                    newProduct.productId.toString()
                ) {
                    existingProduct.quantity += newProduct.quantity; // Update quantity
                    productExists = true;
                    break;
                }
            }

            // If product doesn't exist, add it to the order
            if (!productExists) {
                order.products.push({
                    productId: mongoose.Types.ObjectId(newProduct.productId), // Ensure ObjectId conversion
                    quantity: newProduct.quantity,
                });
            }
        }

        // Update order status
        order.status = "processing";

        // Recalculate total price
        let totalPrice = 0;
        for (let product of order.products) {
            const existingProduct = await Product.findById(
                mongoose.Types.ObjectId(product.productId)
            ); // Ensure ObjectId conversion
            if (existingProduct) {
                totalPrice += existingProduct.price * product.quantity;
            }
        }

        // Update the total price of the order
        order.totalPrice = totalPrice;

        // Save the updated order
        const updatedOrder = await order.save();

        // Populate the updated order with product details
        const populatedOrder = await updatedOrder.populate(
            "products.productId"
        );

        return res.status(200).json({
            message: "Order updated successfully",
            updatedOrder: populatedOrder,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error updating order",
            error: err.message,
        });
    }
};

// @desc    Delete an order by order ID
// @route   DELETE /orders/:id
// @access  Public
const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedOrder = await Order.findOneAndDelete({ orderId: id });
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Get single order by orderId
// @route   GET /orders/:id
// @access  Public
const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findOne({ orderId: id })
            .populate("customer")
            .populate("products.productId");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Get all orders within a date range
// @route   GET /orders
// @access  Public
const getOrdersByDateRange = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res
            .status(400)
            .json({ message: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
        return res
            .status(400)
            .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    try {
        const orders = await Order.find({
            orderDate: { $gte: start, $lte: end },
        }).populate("customer");

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = {
    getAllOrders,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderById,
    getOrdersByDateRange,
    updateOrderWithProducts,
};
