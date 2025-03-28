const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve index.html at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// WebSockets for video calling
io.on("connection", (socket) => {
    socket.on("offer", (data) => socket.broadcast.emit("offer", data));
    socket.on("answer", (data) => socket.broadcast.emit("answer", data));
    socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));
    socket.on("chat-message", (data) => socket.broadcast.emit("chat-message", data));
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
