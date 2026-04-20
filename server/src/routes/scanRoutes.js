console.log("✅ scanRoutes file loaded");
const express = require("express");
const router = express.Router();

const { fullScan, getScanStatus } = require("../controllers/scan.controller");

// ✅ POST route
router.post("/full-scan", fullScan);

// ✅ GET route (THIS WAS MISSING OR WRONG)
router.get("/scan-status/:id", getScanStatus);

router.get("/scan-status/:id", (req, res, next) => {
    console.log("✅ HIT scan-status route");
    next();
}, getScanStatus);

module.exports = router;