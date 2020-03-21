const http = require('http');

const express = require('express');
const socketIo = require('socket.io');

const app = express();

app.use('/lib', express.static('node_modules'));
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('Client connected');
});

server.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
