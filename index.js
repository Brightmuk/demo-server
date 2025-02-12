const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });  // Your WebSocket signaling server

// Store connected clients
let clients = {};

wss.on('connection', (socket) => {
  console.log('New client connected');
  
  // Generate a user ID based on the connection or use the client's IP address
  let userId = `${Date.now()}`;
  clients[userId] = socket;

  // Handle incoming messages from clients
  socket.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received message: ', data);

    switch (data.type) {
      case 'join':
        // Handle a new user joining
        clients[data.userId] = socket;
        console.log(`User ${data.userId} joined`);
        break;
      
      case 'offer':
        // When an offer is received, forward it to the target user (Client B)
        if (clients[data.target]) {
          clients[data.target].send(JSON.stringify(data));
        }
        break; 

      case 'answer':
        // When an answer is received, forward it to the target user (Client A)
        if (clients[data.target]) {
          clients[data.target].send(JSON.stringify(data));
        }
        break;

      case 'candidate':
        // Forward ICE candidates between peers
        if (clients[data.target]) {
          clients[data.target].send(JSON.stringify(data));
        }
        break;

      case 'leave':
        // Handle when a user leaves
        delete clients[data.userId];
        console.log(`User ${data.userId} left`);
        break;

      default:
        console.log('Unrecognized message type:', data.type);
    }
  });

  // Handle socket closure
  socket.on('close', () => {
    for (let userId in clients) {
      if (clients[userId] === socket) {
        delete clients[userId];
        break;
      }
    }
    console.log('Client disconnected');
  });
});

// Helper function to send messages to a specific client
function sendToClient(targetUserId, message) {
  if (clients[targetUserId]) {
    clients[targetUserId].send(JSON.stringify(message));
  }
}
console.log("WebSocket signaling server running on port: 8080");