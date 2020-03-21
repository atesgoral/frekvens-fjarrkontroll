function init(socket) {
  socket.on('connect', () => {
    console.log('Connected');
  });
  
  socket.on('event', (data) => {
    console.log('Data', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected');
  });
}