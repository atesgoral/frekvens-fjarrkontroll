const http = require('http');

const express = require('express');
const socketIo = require('socket.io');

const app = express();

app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('identify', (secret) => {
    if (secret == process.env.FREKVENS_CLIENT_SECRET) {
      console.log('FREKVENS connected');
    }
  });  
});

server.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
