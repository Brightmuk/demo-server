// chat-server.js
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid"); // for unique message IDs

const wss = new WebSocket.Server({ port: 8081 });

// In-memory store: { roomName: [ {id, user, message, time} ] }
const chatRooms = {};

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Handle messages from clients
  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === "join") {
        // join room
        ws.room = parsed.room;
        ws.user = parsed.user;
        if (!chatRooms[parsed.room]) chatRooms[parsed.room] = [];
        ws.send(
          JSON.stringify({
            type: "history",
            room: parsed.room,
            messages: chatRooms[parsed.room],
          })
        );
      }

      if (parsed.type === "chat") {
        const message = {
          id: uuidv4(),
          user: ws.user || "Anonymous",
          message: parsed.message,
          time: new Date().toISOString(),
        };

        // Save message in room
        if (ws.room) {
          chatRooms[ws.room].push(message);

          // Broadcast to all in the same room
          wss.clients.forEach((client) => {
            if (
              client.readyState === WebSocket.OPEN &&
              client.room === ws.room
            ) {
              client.send(
                JSON.stringify({
                  type: "chat",
                  room: ws.room,
                  message,
                })
              );
            }
          });
        }
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("Chat WebSocket server running on ws://localhost:8080");
