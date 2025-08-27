const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const PORT = 8080;
const appetizers = require("./appetizers");
const mockCalls = require("./calls")

// ================== HTTP SERVER ==================


function buildCallResponse(rows) {
  return { calls: rows }; 
}
const mockRows = [{ id: 1, caller: "Alice", time: Date.now() }];

// Utility: load JSON file safely
function loadJsonFromFile(filePath, res) {
  const fullPath = path.join(__dirname, filePath);
  fs.readFile(fullPath, "utf8", (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: `File not found: ${filePath}` }));
    }
    try {
      const jsonData = JSON.parse(data);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(jsonData));
    } catch (parseErr) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON format" }));
    }
  });
}

const server = http.createServer((req, res) => {
   if (req.url === "/appetizers") {
       res.status(200).json({
        "appetizers": appetizers
    })

  }
  let parts = req.url.split("/");
  let endpoint = parts[parts.length - 1];

  endpoint = decodeURIComponent(endpoint).toUpperCase();

  console.log("Resolved endpoint:", endpoint);

  console.log(endpoint)
    switch (endpoint) {
      case "HOME":
      case "LANDING PAGE":
        return loadJsonFromFile("json/ui/home.json", res);
      case "CALL HISTORY":
        return loadJsonFromFile("json/ui/call_history.json", res);
      case "CHAT":
        return loadJsonFromFile("json/ui/chat.json", res);
      case "ACTIVE PLAN":
        return loadJsonFromFile("json/ui/active_plan.json", res);
      case "BILLING HISTORY":
        return loadJsonFromFile("json/ui/billing_history.json", res);
      case "USAGE OVERVIEW":
        return loadJsonFromFile("json/ui/usage_overview.json", res);
      case "SUBSCRIPTION PLANS":
        return loadJsonFromFile("json/ui/subscription_plans.json", res);
      case "LANDING PAGE":
        return loadJsonFromFile("json/ui/landing.json", res);

      case "DATA SOURCE": {
        // Collect request body for POST
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          let dataName;
          try {
            dataName = JSON.parse(body).data_name;
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid JSON body" }));
          }

          switch (dataName) {
            case "txns data viz":
            case "call_history":
              return loadJsonFromFile("json/data/call_history_data.json", res);
            case "call_queue":
              return loadJsonFromFile("json/data/call_queue_data.json", res);
            case "suggestions":
              return loadJsonFromFile("json/data/suggestions_data.json", res);
            case "incoming_call_queue":
              return loadJsonFromFile("json/data/call_queue_data.json", res);
            case "chat":
              return loadJsonFromFile("json/data/chat_data.json", res);
            case "subscription_plans":
              return loadJsonFromFile("json/data/subscription_plans_data.json", res);
            case "active_plan":
              return loadJsonFromFile("json/data/active_plan_data.json", res);
            case "billing_history":
              return loadJsonFromFile("json/data/billing_history_data.json", res);
            case "usage_overview":
              return loadJsonFromFile("json/data/usage_overview_data.json", res);
            default:
              return loadJsonFromFile("json/data/txns_data.json", res);
          }
        });
        break;
      }

      default:
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
  
});




// ================== CALLS SOCKET ==================
const callsWSS = new WebSocket.Server({ noServer: true });



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

  ws.send(JSON.stringify(buildCallResponse(mockCalls)));

  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * mockCalls.length);
    mockCalls[randomIndex][1] = Math.random() > 0.5 ? "waiting" : "Returning";
    mockCalls[randomIndex][5] = new Date().toISOString();
    mockCalls[randomIndex][6] = (Math.random() * 10).toFixed(1);

    console.log(`🔄 Updated call row at index ${randomIndex}`);
    broadcastCalls(buildCallResponse(mockCalls));
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
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Calls WS -> ws://localhost:${PORT}/calls`);
  console.log(`   Messages WS -> ws://localhost:${PORT}/messages`);
  
});

