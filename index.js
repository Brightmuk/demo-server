const WebSocket = require('ws');
const { parseSIPHeaders, checkUserConnection, handleSIPResponse, extractSDP } = require('./utils');

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

  console.log(`📞 Forwarding call request from ${from} to ${to}`);

  const contact = `sip:${calleeUsername}@s91de-43-228-226-5.ngrok-free.app`;
  console.log(`\nCONTACT VALUE: ${contact}\n`);

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
    sdpBody;  // ✅ Forward SDP without modification

  callee.ws.send(inviteMessage);

  ws.send(`SIP/2.0 100 TRYING\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Content-Length: 0\r\n\r\n`);

  console.log("📞 Invite forwarded successfully.\n");
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


//a=rtpmap:110 telephone-event/48000
// a=rtpmap:126 telephone-event/8000
// a=ssrc:3458173155 cname:UJlego4IBZj91pPd
// a=ssrc:3458173155 msid:0a90be72-ffc4-4f61-96fd-1ed38565bf4a 893716b0-f35e-46bc-bf7e-bd4c45c6d1d0
