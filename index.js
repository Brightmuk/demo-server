// websocket-server.js
const http = require("http");
const WebSocket = require("ws");

const PORT = 8080;
const server = http.createServer();

// ================== CALLS SOCKET ==================
const callsWSS = new WebSocket.Server({ noServer: true });

// Initial mock rows for calls
let mockRows = [
  [
    "0786dea6-0856-4f5d-92af-7dcc80800fab",
    "waiting",
    "voice",
    "+25473892034",
    "Lukas Doe",
    "2025-08-20T09:45:30Z",
    2.2,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
  [
    "3a409f8e-ae1e-4e2b-a7f5-347dc0593eb3",
    "Returning",
    "chat",
    "+254731234567",
    "Alice Smith",
    "2025-08-19T15:30:00Z",
    8.8,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
    [
    "0786dea6-0856-4f5d-92af-7dcc80800fab",
    "waiting",
    "voice",
    "+25478892034",
    "John Doe",
    "2025-08-20T09:45:30Z",
    2.2,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
  [
    "3a409f8e-ae1e-4e2b-a7f5-347dc0593eb3",
    "Returning",
    "chat",
    "+254731234567",
    "Benrie Doe",
    "2025-08-19T15:30:00Z",
    8.6,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
    [ 
    "0786dea6-0856-4f5d-92af-7dcc80800fab",
    "waiting",
    "voice",
    "+25478892034",
    "Jacob Doe",
    "2025-08-20T09:45:30Z",
    4.2,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
  [
    "3a409f8e-ae1e-4e2b-a7f5-347dc0593eb3",
    "Returning",
    "chat",
    "+254731234567",
    "Alice Smith",
    "2025-08-19T15:30:00Z",
    2.8,
    '{"url": "/CLAIM CALL/", "service": "CLAIM CALL", "params": {"contact_id": "id"}}',
  ],
];

// Helper: build call response
function buildCallResponse(rows) {
  return {
    response: {
      subdomain_details: "Subdomain Details Updated",
      get_profile: "Session Profile Captured",
      data_source: {
        cols: [
          { label: "id", type: "string", value: "source_id" },
          { label: "status", type: "string", value: "status" },
          { label: "channel", type: "string", value: "channel" },
          { label: "phone", type: "string", value: "profile" },
          { label: "name", type: "string", value: "profile" },
          { label: "createdAt", type: "string", value: "createdAt" },
          { label: "priority", type: "number", value: "priority" },
          { label: "claim", type: "href", value: "claim_call" },
        ],
        rows,
        row_count: rows.length,
      },
    },
    action_id: 54,
    response_status: "00",
    overall_status: "00",
  };
}

function broadcastCalls(obj) {
  const msg = JSON.stringify(obj);
  callsWSS.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

callsWSS.on("connection", (ws) => {
  console.log("🔗 Client connected to /calls");

  ws.send(JSON.stringify(buildCallResponse(mockRows)));

  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * mockRows.length);
    mockRows[randomIndex][1] = Math.random() > 0.5 ? "waiting" : "Returning";
    mockRows[randomIndex][5] = new Date().toISOString();
    mockRows[randomIndex][6] = (Math.random() * 10).toFixed(1);

    console.log(`🔄 Updated call row at index ${randomIndex}`);
    broadcastCalls(buildCallResponse(mockRows));
  }, 10000);

  ws.on("close", () => clearInterval(interval));
});

// ================== MESSAGES SOCKET ==================
const messagesWSS = new WebSocket.Server({ noServer: true });
let messages = []; // simple in-memory chat history

function broadcastMessages(obj) {
  const msg = JSON.stringify(obj);
  messagesWSS.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

messagesWSS.on("connection", (ws) => {
  console.log("🔗 Client connected to /messages");


  ws.on("message", (msg) => {
    const parsed = JSON.parse(msg.toString());
    messages.push(parsed);

    console.log("💬 New message:", parsed);
    broadcastMessages(parsed);
  });
});

// ================== UPGRADE HANDLER ==================
server.on("upgrade", (req, socket, head) => {
  if (req.url === "/calls") {
    callsWSS.handleUpgrade(req, socket, head, (ws) => {
      callsWSS.emit("connection", ws, req);
    });
  } else if (req.url === "/messages") {
    messagesWSS.handleUpgrade(req, socket, head, (ws) => {
      messagesWSS.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// ================== START SERVER ==================
server.listen(PORT, () => {
  console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);
  console.log(`   Calls socket -> ws://localhost:${PORT}/calls`);
  console.log(`   Messages socket -> ws://localhost:${PORT}/messages`);
});
