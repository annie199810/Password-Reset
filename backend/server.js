const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("✅ server.js loaded");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// Health check (Render uses this)
app.get("/", (req, res) => {
  console.log("📡 Health check hit");
  res.send("Backend running");
});

// Routes
app.use("/api/auth", authRoutes);

// Port
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
