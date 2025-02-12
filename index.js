const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let clients = {};  // Store clients using their session id (sessid) or other unique identifiers

wss.on('connection', (socket) => {
  console.log('New client connected');

  console.log(`Data:${data} `);

  // Handle incoming messages from WebSocket
  socket.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle different Verto methods
    switch (data.method) {
      case 'verto.invite':
        handleInvite(data, socket);
        break;

      case 'verto.answer':
        handleAnswer(data, socket);
        break;

      case 'verto.media':
        handleMedia(data, socket);
        break;

      case 'verto.bye':
        handleBye(data, socket);
        break;
    case 'login':
        console.log("Login successful!");

      default:
        console.log('Unknown method:', data.method);
    }
  });

  // When a connection is closed
  socket.on('close', () => {
    // Clean up client on disconnect
    for (let userId in clients) {
      if (clients[userId] === socket) {
        delete clients[userId];
        break;
      }
    }
  });
});

// Handle the invite method (offer)
function handleInvite(data, socket) {
  console.log(`Handling invite from ${data.params.sessid}`);

  // Save the client's session ID (sessid) and associate it with the socket
  clients[data.params.sessid] = socket;

  // Prepare the dialog parameters and SDP
  const dialogParams = data.params.dialogParams;
  const sdp = data.params.sdp;

  console.log(`Incoming call from ${dialogParams.caller_id_name} (${dialogParams.caller_id_number}) to ${dialogParams.destination_number}`);
  
  // Check if the target client (destination_number) is connected
  if (clients[dialogParams.destination_number]) {
    // Forward the invite to the target client
    const inviteMessage = {
      jsonrpc: '2.0',
      method: 'verto.invite',
      params: data.params,
      id: data.id,
    };

    clients[dialogParams.destination_number].send(JSON.stringify(inviteMessage));
    console.log(`Invite sent to client ${dialogParams.destination_number}`);
  } else {
    console.log('Target client not connected.');
  }
}

// Handle the answer method
function handleAnswer(data, socket) {
  console.log(`Handling answer from ${data.params.sessid}`);
  
  // Send the answer back to the client who initiated the call
  if (clients[data.params.sessid]) {
    const answerMessage = {
      jsonrpc: '2.0',
      method: 'verto.answer',
      params: data.params,
      id: data.id,
    };

    clients[data.params.sessid].send(JSON.stringify(answerMessage));
    console.log(`Answer sent to client ${data.params.sessid}`);
  } else {
    console.log('No client found with the given sessid');
  }
}

// Handle the media method (ICE candidates)
function handleMedia(data, socket) {
  console.log(`Handling media (ICE candidate) from ${data.params.sessid}`);

  // Send the ICE candidate to the target client
  if (clients[data.params.callID]) {
    const mediaMessage = {
      jsonrpc: '2.0',
      method: 'verto.media',
      params: data.params,
      id: data.id,
    };

    clients[data.params.callID].send(JSON.stringify(mediaMessage));
    console.log(`Media (ICE candidate) sent to client ${data.params.callID}`);
  } else {
    console.log('No client found with the given callID');
  }
}

// Handle the bye method (hang up)
function handleBye(data, socket) {
  console.log(`Handling bye (hang up) from ${data.params.sessid}`);

  // Close the WebSocket connection (hang up the call)
  if (clients[data.params.callID]) {
    const byeMessage = {
      jsonrpc: '2.0',
      method: 'verto.bye',
      params: data.params,
      id: data.id,
    };

    clients[data.params.callID].send(JSON.stringify(byeMessage));
    console.log(`Bye message sent to client ${data.params.callID}`);
  } else {
    console.log('No client found with the given callID');
  }

  // Optionally clean up after the call
  delete clients[data.params.callID];
}

console.log('WebSocket server is running on ws://localhost:3000');
