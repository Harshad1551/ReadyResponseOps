const express = require("express");
const http = require("http");
const cors = require("cors");

const AuthRoute = require("./Authentication/Auth");
const incidentRoutes = require("./Incident-reporting/incident");
const resourceRoutes = require("./Resources/resources");
const mapRoutes = require("./Map/map");
const messageRoutes = require("./Messages/messages")
const userRoutes = require("./Users/users");
const notificationRoutes = require("./Notifications/notificationRoutes");
// const sttRoutes = require("./routes/stt.routes")

const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:8080", // ✅ your current frontend
      "http://localhost:5173",
      "https://ready-response-frontend.onrender.com"// keep for safety
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 🔹 expose io to routes
app.set("io", io);

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5173",
      "https://ready-response-frontend.onrender.com"
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", AuthRoute);
// app.use("/api", sttRoutes);
app.use("/incidents", incidentRoutes);
app.use("/resources", resourceRoutes);
app.use("/map", mapRoutes);
app.use("/messages", messageRoutes);
app.use("/users", userRoutes);
app.use("/notifications", notificationRoutes);
// 🔌 socket connection
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("join", ({ userId, role, incidentId }) => {
    console.log(`User ${userId} (${role}) joining rooms`);
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
    if (incidentId) socket.join(`incident:${incidentId}`);
  });

  // 📍 RESOURCE TRACKING
  socket.on("resource:update_location", (data) => {
    // data = { resourceId, incidentId, location: { lat, lng }, eta }
    console.log("📍 Location Update:", data);

    // Broadcast to everyone watching this incident
    io.to(`incident:${data.incidentId}`).emit("resource:location_updated", data);
  });

  socket.on("disconnect", () => {

    console.log("🔴 Client disconnected:", socket.id);
  });
});



// Temporary backfill migration


server.listen(5000, () => {
  console.log("Server + WebSocket running on port 5000");
});
