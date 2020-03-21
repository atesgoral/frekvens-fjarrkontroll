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
  
  console.log(frontEl.clientWidth, frontEl.clientHeight);
  
  const frontCtx = frontEl.getContext('2d');
  
  const COLS = 16;
  const ROWS = 16;
  
  const scale = frontEl.width / (3 + 7 / 8);
  
  frontCtx.scale(scale, scale);
  
  const pixels = new Uint8Array(16 * 16);
  
  function drawFront(t) {
    requestAnimationFrame(drawFront);

    pixels.fill(0);

    frontCtx.fillStyle = '#111';
    frontCtx.fillRect(0, 0, (3 + 7 / 8), (3 + 7 / 8));
    
    renderFn(pixels, t / 1000);
    
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        
        frontCtx.fillStyle = pixels[row * 16 + col]
          ? '#fff'
          :'#222';
        
        frontCtx.beginPath();
        frontCtx.arc(
          (col + 1) * 3 / 16,
          (row + 1) * 3 / 16,
          1 / 16, 0,
          Math.PI * 2
        );
        frontCtx.fill();
      }
    }
    
  }
  
  requestAnimationFrame(drawFront);
}
