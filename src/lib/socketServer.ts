import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: {
        server: NetServer & {
            io?: SocketIOServer;
        };
    };
};

// Use globalThis to persist Socket.io instance across hot reloads and module contexts
declare global {
    // eslint-disable-next-line no-var
    var socketIO: SocketIOServer | undefined;
}

export const getIO = (): SocketIOServer | undefined => global.socketIO;

export const initSocketIO = (server: NetServer): SocketIOServer => {
    if (!global.socketIO) {
        global.socketIO = new SocketIOServer(server, {
            path: "/api/socketio",
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        global.socketIO.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            // Join user-specific room for notifications
            socket.on("join-user", (userId: string) => {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user:${userId}`);
            });

            // Leave user room
            socket.on("leave-user", (userId: string) => {
                socket.leave(`user:${userId}`);
            });

            // Join a conversation room
            socket.on("join-conversation", (conversationId: string) => {
                socket.join(`conversation:${conversationId}`);
                console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
            });

            // Leave a conversation room
            socket.on("leave-conversation", (conversationId: string) => {
                socket.leave(`conversation:${conversationId}`);
                console.log(`Socket ${socket.id} left conversation:${conversationId}`);
            });

            // Handle send-message: broadcast to room (excluding sender)
            socket.on("send-message", (data: {
                conversationId: string; message: {
                    id: string;
                    content: string;
                    createdAt: string;
                    sender: { id: string; name: string | null; image: string | null };
                }
            }) => {
                console.log(`Broadcasting message to conversation:${data.conversationId}`);
                socket.to(`conversation:${data.conversationId}`).emit("new-message", data.message);
            });

            // Handle disconnect
            socket.on("disconnect", () => {
                console.log("Socket disconnected:", socket.id);
            });
        });
    }

    return global.socketIO;
};

// Emit a new message to a conversation room
export const emitNewMessage = (conversationId: string, message: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
}) => {
    const io = getIO();
    if (io) {
        console.log(`Emitting new-message to conversation:${conversationId}`);
        io.to(`conversation:${conversationId}`).emit("new-message", message);
    } else {
        console.log("Socket.io not initialized, cannot emit message");
    }
};

// Emit a new message to a specific user for notification
export const emitMessageToUser = (userId: string, message: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
}) => {
    const io = getIO();
    if (io) {
        console.log(`Emitting new-message to user:${userId}`);
        io.to(`user:${userId}`).emit("new-message", message);
    }
};

// Emit a notification to a specific user
export const emitNotification = (userId: string, notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    orderId?: string | null;
    listingId?: string | null;
}) => {
    const io = getIO();
    if (io) {
        console.log(`Emitting notification to user:${userId}`);
        io.to(`user:${userId}`).emit("new-notification", notification);
    }
};

