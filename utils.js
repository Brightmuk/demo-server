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
      const sdpBody = extractSDPBody(msgStr);
  
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
        sdpBody;  // ✅ Forwarding SDP answer without modification
  
      caller.ws.send(responseMessage);
    } else {
      console.log(`ℹ️ Received SIP Response: ${firstLine}`);
    }
  }
  function extractSDP(message) {
    const parts = message.split("\r\n\r\n");
    if (parts.length > 1) {
      return parts[1].trim(); // SDP body is after headers
    }
    return null; // No SDP body found
  }
  
module.exports = { parseSIPHeaders,checkUserConnection,handleSIPResponse,extractSDP };