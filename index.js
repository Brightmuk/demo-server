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
    sdpBody;  

  callee.ws.send(inviteMessage);

  ws.send(`SIP/2.0 100 TRYING\r\n` +
    `Via: ${headers["Via"]}\r\n` +
    `To: ${headers["To"]}\r\n` +
    `From: ${headers["From"]}\r\n` +
    `Call-ID: ${callId}\r\n` +
    `CSeq: ${headers["CSeq"]}\r\n` +
    `Content-Length: 0\r\n\r\n`);

  console.log(`📞 Invite forwarded successfully.\n SDP: ${sdpBody}\n`);
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
    return parts[1].trim(); // SDP body is after headers
  }
  return null; 
}

// Issue
// v=0
// o=- 4228289409987387900 2 IN IP4 127.0.0.1
// s=-
// t=0 0
// a=group:BUNDLE 0
// a=extmap-allow-mixed
// a=msid-semantic: WMS 826794ff-4ae2-4523-ac44-ade5219f5c91
// m=audio 6875 UDP/TLS/RTP/SAVPF 111 63 9 102 0 8 13 110 126
// c=IN IP4 120.235.19.172
// a=rtcp:9 IN IP4 0.0.0.0
// a=candidate:1620195338 1 udp 2122194687 192.168.10.34 38191 typ host generation 0 network-id 3 network-cost 10
// a=candidate:4288087147 1 udp 2122063615 127.0.0.1 39532 typ host generation 0 network-id 1
// a=candidate:601020302 1 udp 2122262783 2409:8a55:1015:dfc4:2cd3:85ff:fef2:b2cd 49088 typ host generation 0 network-id 4 network-cost 10
// a=candidate:3532574896 1 udp 2122136831 ::1 41655 typ host generation 0 network-id 2
// a=candidate:3184896256 1 udp 1686055167 2409:8a55:1015:dfc4:5988:36a0:49c3:725c 49088 typ srflx raddr 2409:8a55:1015:dfc4:2cd3:85ff:fef2:b2cd rport 49088 generation 0 network-id 4 network-cost 10
// a=candidate:2170087155 1 tcp 1518083839 127.0.0.1 46605 typ host tcptype passive generation 0 network-id 1
// a=candidate:2889953832 1 tcp 1518157055 ::1 47945 typ host tcptype passive generation 0 network-id 2
// a=candidate:3485947379 1 udp 1685987071 120.235.19.172 6875 typ srflx raddr 192.168.10.34 rport 38191 generation 0 network-id 3 network-cost 10
// a=ice-ufrag:LGeS
// a=ice-pwd:JcEAli0BmBllsKAgL3Vq3S7j
// a=ice-options:trickle renomination
// a=fingerprint:sha-256 5E:DF:B2:22:D7:3B:49:00:06:34:CB:46:B0:73:FA:6D:C4:F5:80:B7:A7:2C:40:54:35:18:18:B3:7A:58:46:47
// a=setup:actpass
// a=mid:0
// a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=sendrecv
// a=msid:826794ff-4ae2-4523-ac44-ade5219f5c91 1be832db-9fdc-4611-b8d3-563b74be51a4
// a=rtcp-mux
// a=rtpmap:111 opus/48000/2
// a=rtcp-fb:111 transport-cc
// a=fmtp:111 minptime=10;useinbandfec=1
// a=rtpmap:63 red/48000/2
// a=fmtp:63 111/111
// a=rtpmap:9 G722/8000
// a=rtpmap:102 ILBC/8000
// a=rtpmap:0 PCMU/8000
// a=rtpmap:8 PCMA/8000
// a=rtpmap:13 CN/8000
// a=rtpmap:110 telephone-event/48000
// a=rtpmap:126 telephone-event/8000
// a=ssrc:1477820133 cname:QKBsFKTrPE21DcgV
// a=ssrc:1477820133 msid:826794ff-4ae2-4523-ac44-ade5219f5c91 1be832db-9fdc-4611-b8d3-563b74be51a4


// okay
// v=0
// o=- 6189098828662722251 2 IN IP4 127.0.0.1
// s=-
// t=0 0
// a=group:BUNDLE 0
// a=extmap-allow-mixed
// a=msid-semantic: WMS 836ac5ad-906e-4047-b39c-75fe68754492
// m=audio 59236 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126
// c=IN IP4 101.44.80.66
// a=rtcp:9 IN IP4 0.0.0.0
// a=candidate:2081502580 1 udp 2122194687 192.168.10.27 56946 typ host generation 0 network-id 1 network-cost 10
// a=candidate:4158700998 1 udp 2122129151 26.26.26.1 62739 typ host generation 0 network-id 3 network-cost 50
// a=candidate:2191123372 1 udp 2122262783 2409:8a55:1015:dfc4:1dc4:7621:399b:3fdc 57469 typ host generation 0 network-id 2 network-cost 10
// a=candidate:48158700 1 tcp 1518214911 192.168.10.27 9 typ host tcptype active generation 0 network-id 1 network-cost 10
// a=candidate:2301583198 1 tcp 1518149375 26.26.26.1 9 typ host tcptype active generation 0 network-id 3 network-cost 50
// a=candidate:4233494836 1 tcp 1518283007 2409:8a55:1015:dfc4:1dc4:7621:399b:3fdc 9 typ host tcptype active generation 0 network-id 2 network-cost 10
// a=candidate:3791517556 1 udp 1685921535 101.44.80.66 59236 typ srflx raddr 26.26.26.1 rport 62739 generation 0 network-id 3 network-cost 50
// a=candidate:3546010698 1 udp 1685987071 120.235.19.172 6837 typ srflx raddr 192.168.10.27 rport 56946 generation 0 network-id 1 network-cost 10
// a=ice-ufrag:NOPW
// a=ice-pwd:9FWMVvxOKOGMenUkrljcFTQN
// a=ice-options:trickle
// a=fingerprint:sha-256 95:8E:28:9E:85:8A:E1:39:7C:8B:36:EB:8B:B9:3B:B6:4E:A5:2E:F2:D9:2E:1B:75:F0:11:FE:43:33:D7:1A:D6
// a=setup:actpass
// a=mid:0
// a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
// a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
// a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
// a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
// a=sendrecv
// a=msid:836ac5ad-906e-4047-b39c-75fe68754492 0e660e05-6664-48ef-8601-1d2ac4b6ee3b
// a=rtcp-mux
// a=rtcp-rsize
// a=rtpmap:111 opus/48000/2
// a=rtcp-fb:111 transport-cc
// a=fmtp:111 minptime=10;useinbandfec=1
// a=rtpmap:63 red/48000/2
// a=fmtp:63 111/111
// a=rtpmap:9 G722/8000
// a=rtpmap:0 PCMU/8000
// a=rtpmap:8 PCMA/8000
// a=rtpmap:13 CN/8000
// a=rtpmap:110 telephone-event/48000
// a=rtpmap:126 telephone-event/8000
// a=ssrc:1988756201 cname:G/AbXHnB/9D3uZkG
// a=ssrc:1988756201 msid:836ac5ad-906e-4047-b39c-75fe68754492 0e660e05-6664-48ef-8601-1d2ac4b6ee3b


//