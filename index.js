const WebSocket = require('ws');
const { parseSIPHeaders, checkUserConnection, handleSIPResponse } = require('./utils');


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
    } else if (msgStr.startsWith("CANCEL")) {
      handleCancel(ws, headers);
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

  // 📌 Schedule a check in 10 seconds
  // setTimeout(() => {
  //   checkUserConnection(username);
  // }, 10000);

  console.log(`✅ User Registered: ${username} (${sipUri})\n`);
}

function handleInvite(ws, headers) {
  console.log("Handling Invite...");
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

  // Ensure Contact Header is properly formatted
  //Now we hardcode the value of the ip address
  const contact = `sip:${calleeUsername}@s91de-43-228-226-5.ngrok-free.app`;
  console.log(`\nCONTACT VALUE: ${contact}\n`);

  // Basic SDP Offer 
  const sdpBody = `v=0
    o=- 0 0 IN IP4 127.0.0.1
    s=Call Session 
    c=IN IP4 127.0.0.1
    t=0 0
    m=audio 7078 RTP/AVP 0 101
    a=rtpmap:0 PCMU/8000
    a=rtpmap:101 telephone-event/8000
    a=fmtp:101 0-16`;

  const inviteMessage =
    `INVITE sip:${calleeUsername}@server SIP/2.0\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Contact: ${contact}\r\n` +
    `Content-Type: application/sdp\r\n` +
    `Content-Length: ${sdpBody.length}\r\n\r\n` +
    sdpBody;

  callee.ws.send(inviteMessage);

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
function handleCancel(ws, headers) {
  const callId = headers["Call-ID"];

  console.log(`🚫 Call Canceled: ${callId}`);

  // Send 200 OK for CANCEL request
  const response = `SIP/2.0 200 OK\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Content-Length: 0\r\n\r\n`;

  ws.send(response);

}







