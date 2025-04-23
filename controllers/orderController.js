const Order = require('../models/Order');

const getAllOrders = async (req, res) => {
    const { sortBy = 'createdAt', order = 'desc', status } = req.query;
    
    let filter = {};
    if (status) {
        filter.status = status;
    }

    try {
        const orders = await Order.find(filter).sort({ [sortBy]: order === 'desc' ? -1 : 1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const addOrder = async (req, res) => {
    try {
        const newOrder = new Order();
        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully', newOrder });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'canceled', 'delivered', 'shipped'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    getAllOrders,
    addOrder,
    updateOrderStatus,
    deleteOrder
};
