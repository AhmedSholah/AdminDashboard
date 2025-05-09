const Customer = require("../models/Customer");

// Get All Customers + Search + Filter
const getAllCustomers = async (req, res) => {
  const { customerName, numberOfOrders, tag, customerEmail, total } = req.query;
  const { customerId } = req.params;
  const { search } = req.query;

  let filter = {};
  if (customerId) {
    filter.customerId = parseInt(customerId);
  }
  if (customerName) {
    filter.customerName = { $regex: customerName, $options: "i" };
  }

  if (total) {
    const totalValue = parseFloat(total);
    if (!isNaN(totalValue)) {
      filter.total = totalValue;
    }
  }

  if (numberOfOrders) {
    const numberOfOrdersValue = parseInt(numberOfOrders);
    if (!isNaN(numberOfOrdersValue)) {
      filter.numberOfOrders = numberOfOrdersValue;
    }
  }

  if (customerEmail) {
    filter.customerEmail = { $regex: customerEmail, $options: "i" };
  }

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (search) {
    const regex = new RegExp(search, "i");

    if (isNaN(search)) {
      filter.$or = [
        { customerName: regex },
        { customerEmail: regex },
         { customerNumber: regex },
        { tags: { $in: [regex] } },
      ];
    } else {
      const searchNumber = parseFloat(search);
      filter.$or = [
        { numberOfOrders: { $gte: searchNumber } },
        { total: { $gte: searchNumber } },
      ];
    }
  }
  const limitParam = parseInt(req.query.limit) || 10;
  const currentPage = parseInt(req.query.page) || 1;
  const skip = (currentPage - 1) * limitParam;

  try {
    const totalCustomers = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .skip(skip)
      .limit(limitParam)
      .sort({ customerName: 1 });

    const totalPages = Math.ceil(totalCustomers / limitParam);

    if (currentPage > totalPages && totalPages !== 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.status(200).json({
      customers,
      currentPage,
      totalPages,
      totalCustomers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add a new Customer
const addCustomer = async (req, res) => {
  try {
    const {
      customerId,
      customerImage,
      customerName,
      customerEmail,
      customerNumber,
      numberOfOrders,
      total,
      tags,
    } = req.body;

    const newCustomer = new Customer({
      customerId,
      customerImage,
      customerName,
      customerEmail,
      numberOfOrders,
      customerNumber,
      total,
      tags,
    });

    await newCustomer.save();
    res
      .status(201)
      .json({ message: "Customer created successfully", newCustomer });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update a Customer
const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    "customerId",
    "customerImage",
    "customerName",
    "customerEmail",
    "numberOfOrders",
    "customerNumber",
    "total",
    "tags",
  ];
  const updates = {};

  // نعدي على الفيلدات المسموحة ونجهز اللي هيتحدث
  for (let key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  try {
    // هنا بنبحث بـ customerId مش _id
    const updatedCustomer = await Customer.findOneAndUpdate(
      { customerId: id }, // بندور على customerId
      updates,
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a Customer
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCustomer = await Customer.findOneAndDelete({ customerId: id });
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
};
