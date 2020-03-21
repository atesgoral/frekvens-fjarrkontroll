const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

http.createServer(app);

const io = socketIo(http);

app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});




io.on('connection', (socket) => {
  console.log('Client connected');
});

http.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
