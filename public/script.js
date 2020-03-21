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
  
  const renderFn = new Function([ 'pixels', 't' ], scriptEl.value);
  
  scriptEl.addEventListener('change', () => {
    const script = scriptEl.value;
    
    socket.emit('script', script);
  });
  
  const frontEl = document.querySelector('#front');
  
  frontEl.width = frontEl.clientWidth;
  frontEl.height = frontEl.clientHeight;
  
  const frontCtx = frontEl.getContext('2d');
  
  const pixels = new Uint8Array(16 * 16);
  
  function drawFront(t) {
    requestAnimationFrame(drawFront);
    
    frontCtx.fillStyle = 'red';

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        frontCtx.beginPath();
        frontCtx.arc(col * )
      }
    }
    
  }
  
  requestAnimationFrame(drawFront);
}
