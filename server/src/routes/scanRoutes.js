const express = require("express");
const router = express.Router();

const { fullScan } = require("../controllers/scan.controller");

// FULL SCAN ROUTE
router.post("/full-scan", fullScan);

module.exports = router;