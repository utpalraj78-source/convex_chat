import { io } from "socket.io-client";

// Create a singleton socket instance
let socket = null;

export function initializeSocket(token) {
    if (socket) {
        socket.close();
    }

    socket = io("http://localhost:5000", {
        auth: { token },
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
    });

    // Debug logging
    socket.on("connect", () => {
        console.log("✅ Socket connected");
    });

    socket.on("connect_error", (error) => {
        console.error("🔴 Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
    });

    return socket;
}

export function getSocket() {
    return socket;
}