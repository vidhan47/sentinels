const express = require("express");
const cors = require("cors");

// IMPORTANT: match YOUR filename exactly
const scanRoutes = require("./routes/scanRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "AI Pentester Backend Running 🚀" });
});

// API route
app.use("/api", scanRoutes);

module.exports = app;