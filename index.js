const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
let clients = {};

wss.on("connection", (ws) => {
    console.log('New client connected...');
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case "join":
                clients[data.clientId] = ws;
                console.log(`Client ${data.clientId} joined`);
                break;
            case "offer":
            case "answer":
            case "candidate":
                let target = clients[data.targetId];
                if (target) {
                    target.send(JSON.stringify(data));
                }
                break;
        }
    });

    ws.on("close", () => {
        console.log("Service closed...");
        for (let clientId in clients) {
            if (clients[clientId] === ws) {
                delete clients[clientId];
                break;
            }
        }
    });
});

console.log("WebSocket server running on ws://localhost:3000");
