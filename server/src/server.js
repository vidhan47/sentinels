require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

// ✅ correct route import
const scanRoutes = require("./routes/scanRoutes");

// ✅ mount all scan routes
app.use("/api", scanRoutes);

// ✅ START SERVER (ONLY ONCE)
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  console.error("Server failed to start:", err.message);
});