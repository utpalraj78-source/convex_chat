import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";
import User from "./models/User.js";

const users = {}; // userId -> socketId

export default function attachWS(server) {
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 5 * 60 * 1000, // 5 minutes
      skipMiddlewares: true,
    },
    pingTimeout: 60000,        // Increased to 60 seconds
    pingInterval: 25000,       // Keep 25 seconds
    upgradeTimeout: 20000,     // Increased to 20 seconds
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    maxHttpBufferSize: 1e8,    // 100 MB
    cookie: {
      name: "io",
      path: "/",
      httpOnly: true,
      sameSite: "lax"
    }
  });

  // Authenticate socket with JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      console.error("JWT verification failed", err);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (!socket.user || !socket.user.id) {
      socket.disconnect(true);
      return;
    }
    const userId = socket.user.id;
    users[userId] = socket.id;
    socket.join(userId);

    // Ensure user can re-join their room if needed (for multi-tab or reconnect)
    socket.on("join", (joinUserId) => {
      users[joinUserId] = socket.id;
      socket.join(joinUserId);
    });

    // Only emit online users list, no console log
    io.emit("onlineUsers", Object.keys(users));

    // Private messages
    socket.on("private:send", async (message) => {
      try {
        if (message.type === "file" || message.type === "voice") {
          io.to(message.to).emit("private:receive", message);
          socket.to(userId).emit("private:receive", message);
          return;
        }

        if (message.type === "text") {
          const msgToSend = {
            ...message,
            from: userId,
            time: message.time || new Date()
          };
          io.to(message.to).emit("private:receive", msgToSend);
          socket.to(userId).emit("private:receive", msgToSend);
        }
      } catch (err) {
        console.error("[socket.io] Message send error:", err);
        socket.emit("message:error", { error: err.message || "Failed to send message" });
      }
    });


    // Call request
    socket.on("call:request", async ({ to, type }) => {
      try {
        console.log(`[socket.io] call:request from ${userId} to ${to}, type: ${type}`);
        const caller = await User.findById(userId).select("username");
        io.to(to).emit("call:request", {
          from: userId,
          name: caller?.username || "Unknown User",
          type,
        });
        console.log(`[socket.io] call:request emitted to ${to}`);
      } catch (err) {
        console.error("Error fetching caller name:", err);
      }
    });

    socket.on("call:answer", async ({ to, accepted, type }) => {
      const responder = await User.findById(userId).select("username");
      io.to(to).emit("call:answer", {
        from: userId,
        accepted,
        type,
        name: responder?.username || "Unknown"
      });
    });

    socket.on("call:incoming", ({ to, callData }) => {
      io.to(to).emit("call:incoming", { from: userId, ...callData });
    });

    socket.on("call:end", ({ to }) => {
      io.to(to).emit("call:end", { from: userId });
    });

    ["webrtc:offer", "webrtc:answer", "webrtc:candidate"].forEach((evt) => {
      socket.on(evt, (payload) => {
        io.to(payload.to).emit(evt, { ...payload, from: userId });
      });
    });

    socket.on("disconnect", () => {
      delete users[userId];
      io.emit("onlineUsers", Object.keys(users));
    });
  });
}
