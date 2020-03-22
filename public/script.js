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
  const PIXEL_RADIUS = 1;
  const PIXEL_SPACING = 1;
  const PIXEL_OC = 2 * PIXEL_RADIUS + PIXEL_SPACING;
  const GUTTER = 2;
  const CUBE_WIDTH = GUTTER * 2
    + PIXEL_RADIUS * 2 * COLS
    + PIXEL_SPACING * (COLS - 1);
  const CUBE_HEIGHT = GUTTER * 2
    + PIXEL_RADIUS * 2 * ROWS
    + PIXEL_SPACING * (ROWS - 1);
  
  frontCtx.scale(
    frontEl.width / CUBE_WIDTH,
    frontEl.height / CUBE_HEIGHT
  );
  
  const pixels = new Uint8Array(ROWS * COLS);
  
  function drawFront(t) {
    requestAnimationFrame(drawFront);

    pixels.fill(0);

    frontCtx.fillStyle = '#111';
    frontCtx.fillRect(0, 0, CUBE_WIDTH, CUBE_HEIGHT);
    
    renderFn(pixels, t / 1000);
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        
        frontCtx.fillStyle = pixels[row * COLS + col]
          ? '#fff'
          : '#222';
        
        frontCtx.beginPath();
        frontCtx.arc(
          GUTTER + col * PIXEL_OC,
          GUTTER + row * PIXEL_OC,
          PIXEL_RADIUS,
          0,
          Math.PI * 2
        );
        frontCtx.fill();
      }
    }
    
  }
  
  requestAnimationFrame(drawFront);
}
