function init(socket) {
  socket.on('connect', (client) => {
    console.log('Connected');
  });
  
  socket.on('red', () => {
    console.log('Red button pressed');
  });

  socket.on('yellow', () => {
    console.log('Red button pressed');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected');
  });
}