const express = require("express");
const cors = require("cors");

// ✅ IMPORT ROUTES
const scanRoutes = require("./routes/scanRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DEBUG (important for us)
console.log("✅ app.js loaded");
console.log("✅ scanRoutes object:", typeof scanRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "AI Pentester Backend Running 🚀" });
});

// ✅ MOUNT ROUTES
app.use("/api", scanRoutes);

module.exports = app;