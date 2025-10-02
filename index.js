const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const PORT = 8085;
const appetizers = require("./appetizers");
const mockCalls = require("./calls")
// ================== HTTP SERVER ==================



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
  console.log("Received request:", req.method, req.url);
  if (req.url === "/appetizers") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      "appetizers": appetizers
    }));
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
        console.log(dataName)
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
    type: "queue_update",
    payload: {
      "response": {

        "subdomain_details": "Subdomain Details Updated",
        "get_profile": "Session Profile Captured",
        "data_source": {
          "cols": [
            {
              "label": "sessionId",
              "type": "string",
              "value": "sessionId"
            },
            {
              "label": "channel",
              "type": "string",
              "value": "channel",
              "list_filters": [
                "voice",
                "chat",
                "Whatsapp",
                "Mail",
                "SMS"
              ]
            },
            {
              "label": "phone",
              "type": "string",
              "value": "phone",
              "search_filters": true
            },
            {
              "label": "name",
              "type": "string",
              "value": "name"
            },
            {
              "label": "createdAt",
              "type": "datetime",
              "value": "createdAt"
            },
            {
              "label": "status",
              "type": "string",
              "value": "status"
            },
            {
              "label": "priority",
              "type": "string",
              "value": "priority"
            },
            {
              "label": "waiting",
              "type": "string",
              "value": "waiting"
            },
            {
              "label": "claimed",
              "type": "string",
              "value": "claimed"
            },
            {
              "label": "Claim",
              "type": "href",
              "value": "Claim"
            },
            {
              "label": "Transfer",
              "type": "href",
              "value": "Transfer"
            },
            {
              "label": "Cancel",
              "type": "href",
              "value": "Cancel"
            },
            {
              "label": "domain",
              "type": "string",
              "value": "domain"
            },
            {
              "label": "token",
              "type": "string",
              "value": "token"
            },
            {
              "label": "isDuplicatePhone",
              "type": "boolean",
              "value": "isDuplicatePhone"
            }
          ],
          "rows": rows,
          "lines": [],
          "groups": [],
          "data": [],
          "min_id": 0,
          "max_id": 0,
          "row_count": 5
        }
      },
      action_id: 54,
      response_status: "00",
      overall_status: "00",
    }
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
    mockCalls[randomIndex][4] = new Date().toISOString();

    console.log(`🔄 Updated call row at index ${randomIndex}`);
    broadcastCalls(buildCallResponse(mockCalls));
  }, 30000);

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
  console.log(`✅ Http Server running on http://{baseurl}:${PORT}`);
  console.log(`   WS -> ws://{baseurl}:${PORT}/`);

});

