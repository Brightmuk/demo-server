const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3000 });

let clients = {};

server.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(JSON.stringify(data, null, 2));
        switch (data.type) {
            case 'join':
                clients[data.userId] = socket;
                console.log(`User ${data.userId} joined`);
                break;

            case 'offer':
            case 'answer':
            case 'candidate':
                if (clients[data.target]) {
                    clients[data.target].send(JSON.stringify(data));
                }
                break;

            case 'leave':
                delete clients[data.userId];
                break;
        }
    });

    socket.on('close', () => {
        for (let userId in clients) {
            if (clients[userId] === socket) {
                delete clients[userId];
                break;
            }
        }
    });
}); 

console.log("WebSocket signaling server running on ws://localhost:3000");
