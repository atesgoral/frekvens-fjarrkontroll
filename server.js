const http = require('http');

const express = require('express');
const socketIo = require('socket.io');

const app = express();

app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

const frekvens = { socket: null };
const ui = { socket: null };

let timeSyncInterval = null;
let latency = 0;
let syncDelta = 0;

let overrideScript = null;

io.on('connection', (socket) => {
  console.log('Client connected');
  
  if (overrideScript) {
    socket.emit('script', overrideScript);
  }
  
  socket.on('sync', (syncInfo) => {
    syncInfo.server = Date.now();
    syncInfo.frekvens = {
      latency,
      syncDelta
    };
    socket.emit('syncResponse', syncInfo);
  });
  
  socket.on('identify', (secret) => {
    if (secret === process.env.FREKVENS_CLIENT_SECRET) {
      console.log('FREKVENS authorized');
      
      frekvens.socket = socket;     
     
      timeSyncInterval = setInterval(() => {
        socket.emit('sync', { client: Date.now() });  
      }, 1000);
      
      socket.on('syncResponse', (syncInfo) => {
        const now = Date.now();
        latency = (now - syncInfo.client) / 2;

        syncDelta = syncInfo.server - now + latency;
        
        console.log('Sync response from FREKVENS:', latency, syncDelta);
      });      
      
      socket.on('disconnect', () => {
        frekvens.socket = null;
        clearInterval(timeSyncInterval);    
      });      
    } else if (secret === process.env.UI_CLIENT_SECRET) {
      console.log('UI authorized');
      
      ui.socket = socket;
      
      socket.emit('drive');
      
      socket.on('script', (script) => {
        overrideScript = script;
        socket.broadcast.emit('script', script);
      });

      socket.on('disconnect', () => {
        ui.socket = null;
      });      
    } else {
      console.log('Unauthorized');
    }
  });   
});

server.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
