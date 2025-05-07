const express = require("express");
const {
  getAllOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", addOrder);
router.patch("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);

module.exports = router;
