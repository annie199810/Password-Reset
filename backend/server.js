console.log("✅ server.js loaded");

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// health check (Render needs this)
app.get("/", (req, res) => {
  console.log("📡 Health check hit");
  res.send("Backend is running");
});

// routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
