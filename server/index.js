// server.js
import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// API routes (example)
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend API 🚀" });
});

// ----------------------
// Serve React Frontend
// ----------------------
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "Frontend/dist")));

// Catch-all -> send index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend/dist/index.html"));
});

// ----------------------
// Start server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
