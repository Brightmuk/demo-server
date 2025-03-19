const Srf = require('drachtio-srf');
const srf = new Srf();

srf.connect({
    host: '127.0.0.1', 
    port: 9022,        
    secret: 'cymru'
}); 

// srf.connect({
//     host: 'ws://127.0.0.1:5060',  // WebSockets URL
//     secret: 'cymru'
//   }); 
srf.on('connect', (err, hostport) => {
  if (err) console.error('Failed to connect via WebSockets:', err);
  else console.log(`Connected to Drachtio over WebSockets at: ${hostport}`);
});

// Handle SIP REGISTER requests
srf.register((req, res) => {
    console.log(`\nIncoming SIP REGISTER from ${req.msg.headers.contact}`);
  
    res.send(200, {
      headers: {
        'Contact': req.msg.headers.contact, 
        'Expires': 3600  
      }
    });
  
    console.log('User Registered:', req.msg.headers.contact, '\n');
});

// Handle SIP INVITE requests
srf.invite((req, res) => {
    console.log(`\nIncoming SIP INVITE from ${req.msg.headers.contact}`);
    res.send(486, 'So sorry, busy right now', {
        headers: {
            'X-Custom-Header': 'because why not?'
        }
    });  
});
