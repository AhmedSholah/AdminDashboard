const Order = require("../models/Order");
const Customer =require("../models/Customer")
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
    paymentInfo ,
    limit = 11,
    
  } = req.query;

  let filter = {};
  const { search } = req.query;
 
  if (status) {
    filter.status = status;
    console.log(filter)
  }


  if (orderId) {
    filter.orderId = orderId;  
  }
  if (orderDate) {
    const parsedOrderDate = new Date(orderDate);
    if (!isNaN(parsedOrderDate)) {
      filter.orderDate = parsedOrderDate; 
    } else {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
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
 
   else if (totalPrice) {
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
 
  // Pagination
  const limitParam = parseInt(req.query.limit) || 11;  
  const currentPage = parseInt(req.query.page) || 1;  
  const skip = (currentPage - 1) * limitParam; 

  try {
    const totalOrders = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
    .populate("customer")
    .skip(skip)
    .limit(limitParam)
    .sort({ [sortBy]: order === "desc" ? -1 : 1 }).exec();
    const totalPages = Math.ceil(totalOrders / limitParam);
    if (currentPage > totalPages) {
      return res.status(404).json({ message: "Page not found" });
    }
 
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

// ==============================
// @desc    Create a new empty order
// @route   POST /orders
// @access  Public
const addOrder = async (req, res) => {
  try {
  
    const { orderId, orderDate, status,  customer } = req.body;


    if (!orderId || !orderDate || !status  || !customer || !shippingAddress || !paymentInfo) {
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
    const newOrder = new Order({
      orderId,
      orderDate,
      status,
      customer,  
      shippingAddress, 
      paymentInfo,   
    });

    
    await newOrder.save();
    const populatedOrder = await Order.findById(newOrder._id).populate('customer');
 
    res.status(201).json({ message: "Order created successfully", newOrder: populatedOrder });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==============================
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

// ==============================
// @desc    Delete an order by ID
// @route   DELETE /orders/:id
// @access  Public

const deleteOrder = async (req, res) => {
  let { id } = req.params;
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


// @desc    Get all orders within a date range
// @route   GET /orders
// @access  Public
const getOrdersByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  let filter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    filter.orderDate = { $gte: start, $lte: end };
  }

  try {
    const orders = await Order.find(filter).populate('customer').exec();
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
  getOrdersByDateRange
};
