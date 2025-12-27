import { NextApiRequest } from "next";
import { NextApiResponseWithSocket, initSocketIO } from "@/lib/socketServer";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (!res.socket.server.io) {
        console.log("Initializing Socket.io server...");
        initSocketIO(res.socket.server);
        res.socket.server.io = initSocketIO(res.socket.server);
    }
    res.end();
}
