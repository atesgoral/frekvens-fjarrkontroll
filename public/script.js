function init(socket) {
  socket.on('connect', () => {
    console.log('Connected');
    
    const tokens = /secret=(.+)/.exec(document.cookie);
    
    if (tokens) {
      const secret = tokens[1];
      socket.emit('identify', secret);
    }
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
    const script = scriptEl.value;
    
    socket.emit('script', script);
  });
}
