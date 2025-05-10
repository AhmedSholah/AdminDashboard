const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/summary", dashboardController.getSummary);
//   GET Req --> http://localhost:3000/dashboard/summary

module.exports = router;
