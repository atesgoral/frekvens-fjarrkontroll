const defaultRenderFn = function (pixels, t) {
  const x = Math.cos(t) * 8 + 8 | 0;
  const y = Math.sin(t) * 8 + 8 | 0;

  pixels[y * 16 + x] = 1;        
};

function extractSource(fn) {
  const match = /^function+(?:.+?)+\{(.+?)\}/.exec(fn.toString());
  
  return match && match[1];
}
  
function init(socket) {
  socket.on('connect', () => {
    console.log('Connected');
    
    const match = /secret=(.+)/.exec(document.cookie);
    
    if (match) {
      const secret = match[1];
      socket.emit('identify', secret);
      
      socket.on('drive', () => {
        scriptEl.removeAttribute('disabled');
        scriptEl.focus({ preventScroll: true });
      });
    }
  });
   
  socket.on('disconnect', () => {
    console.log('Disconnected');
  });
  
  const faviconLinkEl = document.querySelector('#favicon'); 
  const scriptEl = document.querySelector('#script');
  const errorEl = document.querySelector('#error');
    
  let renderFn = defaultRenderFn;
  
  
  scriptEl.value = extractSource(defaultRenderFn);
  
  scriptEl.addEventListener('change', () => {
    const script = scriptEl.value;
    
    errorEl.innerHTML = '';
    
    try {
      renderFn = new Function([ 'pixels', 't' ], script);
    } catch (error) {
      renderFn = null;
      errorEl.innerHTML = `Syntax error: ${error.message}`;
      return;
    }
    
    socket.emit('script', script);    
  });
  
  const frontEl = document.querySelector('#front');
  
  frontEl.width = frontEl.clientWidth * 2;
  frontEl.height = frontEl.clientHeight * 2;
    
  const frontCtx = frontEl.getContext('2d');
  
  const COLS = 16;
  const ROWS = 16;
  const PIXEL_RADIUS = 1;
  const PIXEL_SPACING = 1;
  const PIXEL_OC = 2 * PIXEL_RADIUS + PIXEL_SPACING; // center-to-center
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

  const faviconEl = document.createElement('canvas');
  
  faviconEl.width = COLS;
  faviconEl.height = ROWS;
  
  const faviconCtx = faviconEl.getContext('2d');
  
  const pixels = new Uint8Array(ROWS * COLS);
  
  function drawFront(t) {
    requestAnimationFrame(drawFront);

    pixels.fill(0);

    frontCtx.fillStyle = '#111';
    frontCtx.fillRect(0, 0, CUBE_WIDTH, CUBE_HEIGHT);

    faviconCtx.fillStyle = '#111';
    faviconCtx.fillRect(0, 0, COLS, ROWS);

    if (renderFn) {
      try {
        renderFn(pixels, t / 1000);
      } catch (error) {
        renderFn = null;
        errorEl.innerHTML = `Runtime error: ${error.message}`;
      }
    }
     
    if (renderFn) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

          frontCtx.fillStyle = pixels[row * COLS + col]
            ? '#fff'
            : '#222';

          // frontCtx.beginPath();
          // frontCtx.arc(
          //   GUTTER + PIXEL_RADIUS + col * PIXEL_OC,
          //   GUTTER + PIXEL_RADIUS + row * PIXEL_OC,
          //   PIXEL_RADIUS,
          //   0,
          //   Math.PI * 2
          // );
          // frontCtx.fill();
          
          frontCtx.fillRect(
            GUTTER + col * PIXEL_OC,
            GUTTER + row * PIXEL_OC,
            PIXEL_RADIUS * 2,
            PIXEL_RADIUS * 2
          );

          faviconCtx.fillStyle = frontCtx.fillStyle;
          faviconCtx.fillRect(col, row, 1, 1);
        }
      }
    }
    
    faviconLinkEl.href = faviconEl.toDataURL('image/png');
  }
  
  requestAnimationFrame(drawFront);
}
