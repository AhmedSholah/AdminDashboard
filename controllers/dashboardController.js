const Order = require("../models/Order");
const Customer = require("../models/Customer");

const getSummary = async (req, res) => {
  try {
    const orders = await Order.find({});
    const customers = await Customer.find({});

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const numberOfOrders = orders.length;
    const averageOrderValue = numberOfOrders > 0 ? totalRevenue / numberOfOrders : 0;

    const currentDate = new Date();
    const last7Days = new Date(currentDate.setDate(currentDate.getDate() - 7));

    const newOrders = await Order.countDocuments({ createdAt: { $gte: last7Days } });
    const newCustomers = await Customer.countDocuments({ createdAt: { $gte: last7Days } });

    res.status(200).json({
      totalRevenue,
      numberOfOrders,
      averageOrderValue,
      newOrders,
      newCustomers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  getSummary,
};
