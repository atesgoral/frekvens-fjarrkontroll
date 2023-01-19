import {debounce} from './utils.js';

const COLS = 16;
const ROWS = 16;

const COLORS = {
  0: '#000',
  1: '#555',
  2: '#aaa',
  3: '#fff',
};

export const display = {
  init(containerEl) {
    const canvasEl = containerEl.querySelector('#canvas');
    const ctx = canvasEl.getContext('2d');

    let pixelWidth = null;
    let pixelHeight = null;
    let pixelHSpacing = null;
    let pixelVSpacing = null;

    /**
     * 16x16 pixels
     * Pixel width & height: ~1/2" = 0.5
     * Horizontal spacing between pixels: ~9/32" = 0.28125 (0.78125 OC)
     * Vertical spacing between pixels: ~11/16" = 0.6875 (1.1875 OC)
     * Rendering width: ~12 3/8" = 12.375
     * Rendering height: ~18 5/16" = 18.3125
     * Rendering aspect ratio: ~27:40
     * Screen width: 13" = 13
     * Screen height: 19 1/4" = 19.25
     */
    function resize() {
      const width = (canvasEl.width = canvasEl.clientWidth);
      const height = (canvasEl.height = canvasEl.clientHeight);

      pixelWidth = (width / 13) * 0.5;
      pixelHeight = (height / 19.25) * 0.5;
      pixelHSpacing = (width - pixelWidth * 16) / (COLS + 1);
      pixelVSpacing = (height - pixelHeight * 16) / (ROWS + 1);
    }

    resize();

    window.addEventListener('resize', debounce(resize, 250));

    this.render = (pixels) => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          ctx.fillStyle = COLORS[pixels[row * COLS + col] & 3];
          ctx.fillRect(
            pixelHSpacing + col * (pixelWidth + pixelHSpacing),
            pixelVSpacing + row * (pixelHeight + pixelVSpacing),
            pixelWidth,
            pixelHeight,
          );
        }
      }
    };
  },
};
