const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = 5066;
const wss = new WebSocket.Server({ port: PORT });

console.log(`📡 SIP WebSocket Server running on ws://localhost:${PORT}`);

const clients = new Map();

wss.on('connection', (ws) => {
    console.log("✅ New WebSocket connection established");

    ws.on('message', (message) => {
        // Convert Buffer to string
        const msgStr = message.toString('utf-8');  
        console.log("-------------------------------------------");
        console.log("📩 Raw SIP Message:\n", msgStr);

        // Parse SIP headers
        const headers = parseSIPHeaders(msgStr);

        // Determine SIP message type and handle accordingly
        if (msgStr.startsWith("REGISTER")) {
            handleRegister(ws, headers);
        } else if (msgStr.startsWith("INVITE")) {
            handleInvite(ws, headers);
        } else if (msgStr.startsWith("BYE")) {
            handleBye(ws, headers);
        } else if (msgStr.startsWith("SIP/2.0")) {
            handleSIPResponse(ws, msgStr);
        } else {
            console.log("⚠️ Unrecognized SIP message type");
        }
        console.log("-------------------------------------------");
    });
 
    ws.on('close', () => {
        console.log("❌ WebSocket connection closed");
    });
});

function handleRegister(ws, headers) {
  console.log("Handling Register...")
    const sipUri = headers["Contact"];
    const username = headers["From"] ? headers["From"].match(/sip:(\d+)@/)?.[1] : null;

    if (!sipUri || !username) {
        console.log("⚠️ Invalid registration request");
        return ws.send(JSON.stringify({ status: 400, message: "Bad Request: Missing SIP URI or username" }));
    }

    clients.set(username, { ws, sip_uri: sipUri });

    ws.send(`SIP/2.0 200 OK\r\n` +
            `Via: ${headers["Via"]}\r\n` +
            `To: ${headers["To"]}\r\n` +
            `From: ${headers["From"]}\r\n` +
            `Call-ID: ${headers["Call-ID"]}\r\n` +
            `CSeq: ${headers["CSeq"]}\r\n` +
            `Contact: ${sipUri}\r\n` +
            `Expires: 3600\r\n` +
            `Content-Length: 0\r\n\r\n`);
      console.log("CLients",clients);
  // 📌 Schedule a check in 10 seconds
  setTimeout(() => {
    checkUserConnection(username);
  }, 10000);

    console.log(`✅ User Registered: ${username} (${sipUri})\n`);
}

function handleInvite(ws, headers) {
  console.log("Handling Invite...")
    const from = headers["From"];
    const to = headers["To"];
    const callId = headers["Call-ID"];

    if (!from || !to || !callId) {
        return ws.send(JSON.stringify({ status: 400, message: "Bad Request: Missing required headers" }));
    }

    const calleeUsername = to.match(/sip:(\d+)@/)?.[1];
    const callee = clients.get(calleeUsername);

    if (!callee) {
        return ws.send(`SIP/2.0 404 Not Found\r\n` +
                       `Via: ${headers["Via"]}\r\n` +
                       `To: ${headers["To"]}\r\n` +
                       `From: ${headers["From"]}\r\n` +
                       `Call-ID: ${callId}\r\n` +
                       `CSeq: ${headers["CSeq"]}\r\n` +
                       `Content-Length: 0\r\n\r\n`);
    }

    console.log(`📞 Call request from ${from} to ${to}`);

    callee.ws.send(`INVITE sip:${calleeUsername}@server SIP/2.0\r\n` +
                   `Via: ${headers["Via"]}\r\n` +
                   `To: ${headers["To"]}\r\n` +
                   `From: ${headers["From"]}\r\n` +
                   `Call-ID: ${callId}\r\n` +
                   `CSeq: ${headers["CSeq"]}\r\n` +
                   `Contact: ${callee.sip_uri}\r\n` +
                   `Content-Length: 0\r\n\r\n`);

    ws.send(`SIP/2.0 100 TRYING\r\n` +
            `Via: ${headers["Via"]}\r\n` +
            `To: ${headers["To"]}\r\n` +
            `From: ${headers["From"]}\r\n` +
            `Call-ID: ${callId}\r\n` +
            `CSeq: ${headers["CSeq"]}\r\n` +
            `Content-Length: 0\r\n\r\n`);
  console.log("Handling Invite done...\n");
}

function handleBye(ws, headers) {
    console.log(`🚫 Call ended: ${headers["Call-ID"]}`);

    ws.send(`SIP/2.0 200 OK\r\n` +
            `Via: ${headers["Via"]}\r\n` +
            `To: ${headers["To"]}\r\n` +
            `From: ${headers["From"]}\r\n` +
            `Call-ID: ${headers["Call-ID"]}\r\n` +
            `CSeq: ${headers["CSeq"]}\r\n` +
            `Content-Length: 0\r\n\r\n`);
}

// 📌 Handle SIP Responses (100 Trying, 180 Ringing, 200 OK, etc.)
function handleSIPResponse(ws, msgStr) {
  const firstLine = msgStr.split("\n")[0];

  if (firstLine.includes("100 Trying")) {
      console.log("🔄 Received: 100 Trying");
  } else if (firstLine.includes("180 Ringing")) {
      console.log("📞 Received: 180 Ringing");
  } else if (firstLine.includes("200 OK")) {
      console.log("✅ Received: 200 OK");
  } else {
      console.log(`ℹ️ Received SIP Response: ${firstLine}`);
  }
}

function parseSIPHeaders(sipMessage) {
    const headers = {};
    const lines = sipMessage.split("\n");

    for (const line of lines) {
        const match = line.match(/^([\w-]+):\s*(.*)/);
        if (match) {
            const header = match[1].trim();
            const value = match[2].trim();
            headers[header] = value;
        }
    }

    return headers;
}

// 📌 Function to check if the user is still connected
function checkUserConnection(username) {
  const client = clients.get(username);
  console.log("Got client: ",username);
  if (!client || client.ws.readyState !== WebSocket.OPEN) {
      console.log(`❌ User ${username} is not connected. Deregistering...`);
      clients.delete(username);
      return;
  }

  console.log(`🔄 Checking connection for ${username}...`);
  
  // Send a PING message
  client.ws.send(JSON.stringify({ type: "PING" }), (err) => {
      if (err) {
          console.log(`⚠️ Error sending PING to ${username}. Removing from registry.`);
          clients.delete(username);
      } else {
          console.log(`✅ User ${username} is still connected.`);
      }
  });

  // Schedule another check after 10 seconds
  setTimeout(() => checkUserConnection(username), 10000);
}

