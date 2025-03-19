const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = 5066;
const wss = new WebSocket.Server({ port: PORT });

console.log(`📡 SIP WebSocket Server running on ws://localhost:${PORT}`);

const clients = new Map(); // Store registered users

wss.on('connection', (ws) => {
    console.log("✅ New WebSocket connection established");

    ws.on('message', (message) => {
      // Convert Buffer to string
      const msgStr = message.toString('utf-8');  
      console.log("📩 Raw SIP Message:\n", msgStr);
  
      // Check if it's a REGISTER message
      if (msgStr.startsWith("REGISTER")) {
          handleRegister(ws, msgStr);
      } else if (msgStr.startsWith("INVITE")) {
          handleInvite(ws, msgStr);
      } else if (msgStr.startsWith("BYE")) {
          handleBye(ws, msgStr);
      } else {
          console.log("⚠️ Unrecognized SIP message type");
      }
  });

    ws.on('close', () => {
        console.log("❌ WebSocket connection closed");
    });
});

function handleRegister(ws, msg) {
    if (!msg.sip_uri || !msg.username) {
        return ws.send(JSON.stringify({ status: 400, message: "Bad Request: Missing SIP URI or username" }));
    }

    clients.set(msg.username, { ws, sip_uri: msg.sip_uri });

    ws.send(JSON.stringify({
        type: '200 OK',
        status: 200,
        message: "Registered Successfully",
        headers: {
            'Contact': '<sip:sip@10.0.2.2>;+sip.ice;reg-id=1;+sip.instance="<urn:uuid:d725a987-7d83-493e-8564-aecc94050dab>";expires=600',
            'Expires': 3600,
            'Call-ID': uuidv4(),
            'CSeq': '1 REGISTER'
        }
    }));

    console.log(`✅ User Registered: ${msg.username} (${msg.sip_uri})`);
}

function handleInvite(ws, msg) {
    if (!msg.from || !msg.to) {
        return ws.send(JSON.stringify({ status: 400, message: "Bad Request: Missing 'from' or 'to' fields" }));
    }

    const callee = clients.get(msg.to);
    if (!callee) {
        return ws.send(JSON.stringify({ status: 404, message: "User not found" }));
    }

    console.log(`📞 Call request from ${msg.from} to ${msg.to}`);

    callee.ws.send(JSON.stringify({
        type: 'INVITE',
        from: msg.from,
        to: msg.to,
        headers: {
            'Call-ID': uuidv4(),
            'CSeq': '1 INVITE',
            'Contact': callee.sip_uri
        }
    }));

    ws.send(JSON.stringify({
        type: '100 TRYING',
        status: 100,
        message: "Trying..."
    }));
}

function handleBye(ws, msg) {
    console.log(`🚫 Call ended: ${msg.call_id}`);
    ws.send(JSON.stringify({
        type: '200 OK',
        status: 200,
        message: "Call ended successfully"
    }));
}
