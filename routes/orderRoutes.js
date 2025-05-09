const express = require("express");
const {
  getAllOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById, 
  getOrdersByDateRange,
} = require("../controllers/orderController");

const router = express.Router();
router.get("/by-date", getOrdersByDateRange);
router.get("/", getAllOrders);
router.post("/", addOrder);
router.patch("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);
router.get("/:id", getOrderById);


module.exports = router;
