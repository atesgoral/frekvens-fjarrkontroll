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

const DEFAULT_RENDER_FN = function (pixels, t) {
  const x1 = Math.cos(t * 3) * 8 + 8 | 0;
  const y1 = 4;

  pixels[y1 * 16 + x1] = 1;

  const x2 = 4;
  const y2 = Math.sin(t * 2) * 8 + 8 | 0;

  pixels[y2 * 16 + x2] = 1;
};

const DIFFUSE_DISTANCE = 3;
const DIFFUSE_DIAMETER = DIFFUSE_DISTANCE * 2 + 1;
const diffuseFilter = Array(DIFFUSE_DIAMETER ** 2).fill(0);

for (let dy = 0; dy < DIFFUSE_DIAMETER; dy++) {
  for (let dx = 0; dx < DIFFUSE_DIAMETER; dx++) {
    const d = Math.sqrt(
      (dx - DIFFUSE_DISTANCE) ** 2 + (dy - DIFFUSE_DISTANCE) ** 2
    );
    const falloff = d > DIFFUSE_DISTANCE ? 1 : (d / (DIFFUSE_DISTANCE + 1)) ** .05;
    diffuseFilter[dy * DIFFUSE_DIAMETER + dx] = 1 - falloff;
  }
}

function extractSource(fn) {
  return fn
    .toString()
    .split('\n')
    .slice(1, -1)
    .map((line) => line.slice(2))
    .join('\n');
}

function init(socket) {
  let currentScene = null;
  let timeSyncInterval = null;
  let syncDelta = 0;
  let targetSyncDelta = 0;

  function applyScript(script) {
    try {
      currentScene = {
        render: new Function([ 'pixels', 't', 'state' ], script),
        state: {}
      };

      return true;
    } catch (error) {
      currentScene = null;
      errorEl.innerHTML = `Syntax error: ${error.message}`;
    }
  }

  function publishScript(script) {
    if (applyScript(script)) {
      socket.emit('script', script);
    }
  }

  socket.on('connect', () => {
    console.log('Connected');

    timeSyncInterval = setInterval(() => {
      socket.emit('sync', { client: Date.now() });
    }, 1000);

    socket.on('syncResponse', (syncInfo) => {
      const now = Date.now();
      const latency = (now - syncInfo.client) / 2;

      targetSyncDelta = syncInfo.server - now + latency;
      targetSyncDelta += syncInfo.frekvens.syncDelta;

      // console.log('Sync:', latency, targetSyncDelta, syncInfo.frekvens.latency, syncInfo.frekvens.syncDelta);
    });

    const match = /secret=(.+)/.exec(document.cookie);

    if (match) {
      const secret = match[1];

      socket.emit('identify', secret);

      socket.on('drive', () => {
        publishEl.removeAttribute('disabled');
        yellowEl.removeAttribute('disabled');
        redEl.removeAttribute('disabled');
        scriptEl.focus({ preventScroll: true });
      });
    }
  });

  socket.on('script', (script) => {
    scriptEl.value = script;
    applyScript(script);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected');

    clearInterval(timeSyncInterval);
  });

  const faviconLinkEl = document.querySelector('#favicon');
  const scriptEl = document.querySelector('#script');
  const errorEl = document.querySelector('#error');
  const publishEl = document.querySelector('#publish');
  const yellowEl = document.querySelector('#yellow');
  const redEl = document.querySelector('#red');
  const frontEl = document.querySelector('#front');
  const maskEl = document.createElement('canvas');
  const faviconEl = document.createElement('canvas');

  const defaultScript = extractSource(DEFAULT_RENDER_FN);

  scriptEl.value = defaultScript;

  publishScript(defaultScript);

  scriptEl.addEventListener('change', () => {
    const script = scriptEl.value;

    errorEl.innerHTML = '';

    applyScript(script);
  });

  publishEl.addEventListener('click', () => {
    const script = scriptEl.value;

    errorEl.innerHTML = '';

    publishScript(script);
  });

  yellowEl.addEventListener('mousedown', () => socket.emit('yellowDown'));
  yellowEl.addEventListener('mouseup', () => socket.emit('yellowUp'));
  redEl.addEventListener('mousedown', () => socket.emit('redDown'));
  redEl.addEventListener('mouseup', () => socket.emit('redUp'));

  frontEl.width = frontEl.clientWidth * 2;
  frontEl.height = frontEl.clientHeight * 2;

  maskEl.width = frontEl.width;
  maskEl.height = frontEl.height;

  faviconEl.width = COLS;
  faviconEl.height = ROWS;

  const frontCtx = frontEl.getContext('2d');
  const maskCtx = maskEl.getContext('2d');
  const faviconCtx = faviconEl.getContext('2d');

  frontCtx.scale(
    frontEl.width / CUBE_WIDTH,
    frontEl.height / CUBE_HEIGHT
  );

  maskCtx.scale(
    maskEl.width / CUBE_WIDTH,
    maskEl.height / CUBE_HEIGHT
  );

  maskCtx.fillStyle = '#000';
  maskCtx.fillRect(0, 0, CUBE_WIDTH, CUBE_HEIGHT);

  maskCtx.fillStyle = '#fff';

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      maskCtx.beginPath();
      maskCtx.arc(
        GUTTER + PIXEL_RADIUS + col * PIXEL_OC,
        GUTTER + PIXEL_RADIUS + row * PIXEL_OC,
        PIXEL_RADIUS,
        0,
        Math.PI * 2
      );
      maskCtx.fill();
    }
  }

  const pixels = new Uint8Array(ROWS * COLS);

  function drawFront(t) {
    requestAnimationFrame(drawFront);

    syncDelta += (targetSyncDelta - syncDelta) / 10;

    const syncT = Date.now() + syncDelta;

    pixels.fill(0);

    frontCtx.fillStyle = '#000';
    frontCtx.fillRect(0, 0, CUBE_WIDTH, CUBE_HEIGHT);

    faviconCtx.fillStyle = '#000';
    faviconCtx.fillRect(0, 0, COLS, ROWS);

    if (currentScene) {
      try {
        currentScene.render(pixels, syncT / 1000, currentScene.state);
      } catch (error) {
        currentScene = null;
        errorEl.innerHTML = `Runtime error: ${error.message}`;
      }
    }

    const levels = Array(16 * 16).fill(0);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // levels[row * COLS + col] = pixels[row * COLS + col];
        for (let dy = 0; dy < DIFFUSE_DIAMETER; dy++) {
          const y = row + dy - DIFFUSE_DISTANCE;

          if (y < 0 || y >= ROWS) {
            continue;
          }

          for (let dx = 0; dx < DIFFUSE_DIAMETER; dx++) {
            const x = col + dx - DIFFUSE_DISTANCE;

            if (x < 0 || x >= COLS) {
              continue;
            }

            levels[y * COLS + x] = Math.min(
              1,
              levels[y * COLS + x]
                + pixels[row * COLS + col] * diffuseFilter[dy * DIFFUSE_DIAMETER + dx]
            );
          }
        }
      }
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        frontCtx.fillStyle = `hsl(
          0,
          0%,
          ${(levels[row * COLS + col] * 0.95 + 0.05) * 100}%
        `;

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

    frontCtx.globalCompositeOperation = 'multiply';
    frontCtx.drawImage(maskEl, 0, 0, CUBE_WIDTH, CUBE_HEIGHT);
    frontCtx.globalCompositeOperation = 'screen';
    frontCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    frontCtx.fillRect(0, 0, CUBE_WIDTH, CUBE_HEIGHT);
    frontCtx.globalCompositeOperation = 'source-over';

    faviconLinkEl.href = faviconEl.toDataURL('image/png');
  }

  requestAnimationFrame(drawFront);
}
