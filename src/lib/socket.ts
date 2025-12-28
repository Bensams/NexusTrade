import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let isConnecting = false;

export const getSocket = (): Socket => {
    if (!socket && !isConnecting) {
        isConnecting = true;
        socket = io({
            path: "/api/socketio",
            addTrailingSlash: false,
            // Auto-reconnect settings
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            // Timeout settings
            timeout: 20000,
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket?.id);
            isConnecting = false;
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            isConnecting = false;
        });

        // Disconnect when page is about to unload
        if (typeof window !== "undefined") {
            window.addEventListener("beforeunload", () => {
                if (socket?.connected) {
                    socket.disconnect();
                }
            });

            // Handle page visibility changes (tab switching)
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden" && socket?.connected) {
                    // Mark socket as potentially stale but don't disconnect immediately
                    // This helps with tab switching without losing connection
                }
            });
        }
    }
    return socket!;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnecting = false;
    }
};

// Force reconnection (useful after errors)
export const reconnectSocket = () => {
    disconnectSocket();
    return getSocket();
};

