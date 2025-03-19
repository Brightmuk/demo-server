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
module.exports = { parseSIPHeaders,checkUserConnection,handleSIPResponse };