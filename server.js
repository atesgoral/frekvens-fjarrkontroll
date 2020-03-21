const http = require('http');

const express = require('express');
const socketIo = require('socket.io');

const app = express();

app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

const frekvens = { socket: null };
const ui = { socket: null };

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('identify', (secret) => {
    if (secret === process.env.FREKVENS_CLIENT_SECRET) {
      console.log('FREKVENS authorized');
      
      frekvens.socket = socket;
      
      socket.on('red', () => socket.broadcast.emit('red'));
      socket.on('yellow', () => socket.broadcast.emit('yellow'));
    if (secret === process.env.FREKVENS_CLIENT_SECRET) {
      console.log('FREKVENS authorized');
      
      frekvens.socket = socket;
      
      socket.on('red', () => socket.broadcast.emit('red'));
      socket.on('yellow', () => socket.broadcast.emit('yellow'));
    }
  });
  
  socket.on('script', (script) => {
    frekvens.socket && frekvens.socket.emit('script', script);
  });
 
  socket.on('disconnect', () => {
    frekvens.socket = null;
  });
});

server.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
