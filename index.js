const WebSocket = require('ws');

const PORT = 5066;
const wss = new WebSocket.Server({ port: PORT });

console.log(`📡 SIP WebSocket Server running on ws://localhost:${PORT}`);

const clients = new Map();

wss.on('connection', (ws) => {
  console.log("✅ New WebSocket connection established");

  ws.on('message', (message) => {
    const msgStr = message.toString('utf-8');
    console.log("-------------------------------------------");
    console.log("📩 Raw SIP Message:\n", msgStr);

    const headers = parseSIPHeaders(msgStr);
    const sdpBody = extractSDP(msgStr); // Extract SDP body if present
    const firstLine = msgStr.split("\n")[0];
    
     
    if (msgStr.startsWith("REGISTER")) {
      handleRegister(ws, headers);
    } else if (msgStr.startsWith("INVITE")) {
      handleInvite(ws, headers, sdpBody);
    } else if (msgStr.startsWith("BYE")) {
      handleBye(ws, headers);
    } else if (msgStr.startsWith("CANCEL")||firstLine.includes("603 Decline")) {
      handleCancel(ws, headers);
    } else if (msgStr.startsWith("SIP/2.0")) {
      handleSIPResponse(ws, msgStr, headers);
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
  console.log("Handling Register...");
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

  console.log(`✅ User Registered: ${username} (${sipUri})\n`);
}

function handleInvite(ws, headers, sdpBody) {
  console.log("📞 Handling Invite...");
  const from = headers["From"];
  const to = headers["To"];
  const callId = headers["Call-ID"];

  if (!from || !to || !callId || !sdpBody) {
    return ws.send(JSON.stringify({ status: 400, message: "Bad Request: Missing required headers or SDP" }));
  }

  const calleeUsername = to.match(/sip:(\d+)@/)?.[1];
  let callee = clients.get(calleeUsername);

  // Send 100 TRYING immediately
  ws.send(`SIP/2.0 100 TRYING\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Content-Length: 0\r\n\r\n`);

  console.log(`📞 Sent 100 TRYING...`);

  if (!callee) {
    console.log(`🚫 Callee not available. Waiting for 10 seconds...`);

    // Wait for 10 seconds to check again
    setTimeout(() => {
      callee = clients.get(calleeUsername); // Re-check availability

      if (!callee) {
        console.log(`🚫 Callee still unavailable after 10 seconds. Sending 480.`);
        return ws.send(`SIP/2.0 480 Temporarily Unavailable\r\n` +
          `Retry-After: 30\r\n` +
          `Via: ${headers["Via"]}\r\n` +
          `To: ${headers["To"]}\r\n` +
          `From: ${headers["From"]}\r\n` +
          `Call-ID: ${callId}\r\n` +
          `CSeq: ${headers["CSeq"]}\r\n` +
          `Content-Length: 0\r\n\r\n`);
      }

      console.log(`📞 Callee became available. Proceeding with call.`);
      forwardInvite(ws, headers, sdpBody, calleeUsername);
    }, 10000); // 10 seconds timeout
  } else {
    console.log(`📞 Callee is available. Forwarding the call immediately.`);
    forwardInvite(ws, headers, sdpBody, calleeUsername);
  }
}

function forwardInvite(ws, headers, sdpBody, calleeUsername) {
  const callee = clients.get(calleeUsername);
  if (!callee) return; // Ensure callee is still connected before sending invite

  const contact = `sip:${calleeUsername}@s91de-43-228-226-5.ngrok-free.app`;
  const inviteMessage =
    `INVITE sip:${calleeUsername}@server SIP/2.0\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${headers["Call-ID"]}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Contact: ${contact}\r\n` +
    `Content-Type: application/sdp\r\n` +
    `Content-Length: ${sdpBody.length}\r\n\r\n` +
    sdpBody;

  callee.ws.send(inviteMessage);
  console.log(`📞 Invite forwarded successfully to ${calleeUsername}`);
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

function handleCancel(ws, headers) { 
  const callId = headers["Call-ID"];
  console.log(`🚫 Call Canceled: ${callId}`);  
 
  // Extract the caller's and callee's SIP URIs
  const fromUser = headers["From"].match(/sip:(\d+)@/)?.[1];
  const toUser = headers["To"].match(/sip:(\d+)@/)?.[1];

  // Send 200 OK to acknowledge the CANCEL request
  const response = `SIP/2.0 200 OK\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Content-Length: 0\r\n\r\n`;

  ws.send(response);
  console.log(`✅ Sent 200 OK to acknowledge CANCEL from ${fromUser}`);

  // Notify the callee with a 487 Request Terminated response
  if (toUser && clients.has(toUser)) {
    const callee = clients.get(toUser);
    const terminatedResponse = 
      `SIP/2.0 487 Request Terminated\r\n` +
      `Via: ${headers["Via"]}\r\n` +
      `To: ${headers["To"]}\r\n` +
      `From: ${headers["From"]}\r\n` +
      `Call-ID: ${callId}\r\n` +
      `CSeq: ${headers["CSeq"]}\r\n` +
      `Content-Length: 0\r\n\r\n`;

    callee.ws.send(terminatedResponse);
    console.log(`📴 Notified callee ${toUser} that the call was canceled`);
  }
}


//Function to parse headers
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
// 📌 Handle SIP Responses (100 Trying, 180 Ringing, 200 OK, etc.)
function handleSIPResponse(ws, msgStr,headers) {
  const firstLine = msgStr.split("\n")[0];
  
  if (firstLine.includes("100 Trying")) {
    console.log("🔄 Received: 100 Trying");
  } else if (firstLine.includes("180 Ringing")) {
    console.log("📞 Received: 180 Ringing");
  } else if (firstLine.includes("200 OK")) {
    console.log("✅ Handling 200 OK response...");

    const callId = headers["Call-ID"];
    const sdpBody = extractSDP(msgStr);

    if (!callId || !sdpBody) {
      return ws.send(`SIP/2.0 400 Bad Request\r\n`);
    }

    const caller = clients.get(headers["From"]?.match(/sip:(\d+)@/)?.[1]);
    if (!caller) {
      return;
    }

    const responseMessage =
      `SIP/2.0 200 OK\r\n` +
      `Via: ${headers["Via"]}\r\n` +
      `To: ${headers["To"]}\r\n` +
      `From: ${headers["From"]}\r\n` +
      `Call-ID: ${callId}\r\n` +
      `CSeq: ${headers["CSeq"]}\r\n` +
      `Contact: ${headers["Contact"]}\r\n` +
      `Content-Type: application/sdp\r\n` +
      `Content-Length: ${sdpBody.length}\r\n\r\n` +
      sdpBody;  
    caller.ws.send(responseMessage);
  } else {
    console.log(`ℹ️ Received SIP Response: ${firstLine}`);
  }
}
function extractSDP(message) {
  const parts = message.split("\r\n\r\n"); 
  if (parts.length > 1) {
    return ensureEndsWithCRLF(parts[1].trim()); 
  }
  return null; 
}

function ensureEndsWithCRLF(str) {
  return str.endsWith("\r\n") ? str : str + "\r\n";
}