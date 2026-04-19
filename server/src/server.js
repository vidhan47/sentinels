require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

const { fullScan } = require("./controllers/scan.controller");

app.post("/fullscan", fullScan);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  console.error("Server failed to start:", err.message);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});