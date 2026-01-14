import { io } from "socket.io-client";

// Create a singleton socket instance
let socket = null;

export function initializeSocket(token) {
    if (socket) {
        socket.close();
    }

    const socketUrl = "http://127.0.0.1:5000";

    socket = io(socketUrl, {
        auth: { token },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        withCredentials: true
    });

    // Debug logging
    socket.on("connect", () => {
        console.log("✅ Socket connected directly to:", socketUrl);
    });

    socket.on("connect_error", (error) => {
        console.error("🔴 Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
    });

    return socket;
}

export function getSocket() {
    return socket;
}