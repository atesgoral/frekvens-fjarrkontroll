function init(socket) {
  socket.on('connect', (client) => {
    console.log('Connected');
  });
  
  socket.on('red', () => {
    console.log('Red button pressed');
  });

  socket.on('yellow', () => {
    console.log('Yellow button pressed');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected');
  });
  
  const scriptEl = document.querySelector('#script');
  
  scriptEl.addEventListener('change', () => {
    console.log('script:', scriptEl.value);
  });
}
