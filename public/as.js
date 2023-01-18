import asc from 'assemblyscript/asc';

const COLS = 16;
const ROWS = 16;

const COLORS = {
  0: '#000',
  1: '#555',
  2: '#aaa',
  3: '#fff',
};

function debounce(fn, delay) {
  let timeout = null;

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(), delay);
  };
}

async function compile(source) {
  const {error, binary} = await asc.compileString(source, {
    use: ['Math=NativeMathf'],
    runtime: 'stub',
  });

  if (error) {
    const re = new Error('Compilation failed');
    re.cause = error;
    throw re;
  }

  return binary;
}

async function hexDump(binary, cols = 12) {
  const hex = Array.from(binary)
    .map(
      (byte, i) =>
        `0x${byte.toString(16).padStart(2, '0')}${
          i % cols === cols - 1 ? ',\n' : ', '
        }`,
    )
    .join('');

  console.log(hex);
}

async function instantiate(binary) {
  const {error, instance} = await WebAssembly.instantiate(binary);

  return instance;
}

function interpolate(template, values) {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => values[key]);
}

function unindent(s) {
  const lines = s.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  const indentation = lines[0].match(/^\s*/)[0].length;

  return lines.map((line) => line.slice(indentation)).join('\n');
}

const template = unindent(document.querySelector('#template').innerHTML);
const sampleCode = unindent(document.querySelector('#sample-code').innerHTML);

const canvas = document.querySelector('#canvas');
const editor = document.querySelector('#editor');
const status = document.querySelector('#status');
const preamble = document.querySelector('#preamble');
const epilogue = document.querySelector('#epilogue');

const separator = '<<<>>>';
const [preambleText, epilogueText] = interpolate(template, {
  code: separator,
}).split(separator);

preamble.appendChild(document.createTextNode(preambleText.trimEnd()));
editor.value = sampleCode;
epilogue.appendChild(document.createTextNode(epilogueText.trimStart()));

function setStatus(s, options) {
  status.setAttribute('error', options?.error || '');
  status.innerHTML = s;
}

let instance = null;
let pixels = null;

async function refresh() {
  try {
    const code = editor.value;

    const source = interpolate(template, {code});

    setStatus('Compiling&hellip;');
    const binary = await compile(source);

    hexDump(binary);

    setStatus('Instantiating&hellip;');
    instance = await instantiate(binary);

    pixels = new Uint8Array(instance.exports.memory.buffer);

    setStatus('');
  } catch (error) {
    setStatus(`${error.message} (${error.cause?.message})`, {error: true});
  }
}

editor.addEventListener('keyup', debounce(refresh, 500));

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
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  pixelWidth = (canvas.width / 13) * 0.5;
  pixelHeight = (canvas.height / 19.25) * 0.5;
  pixelHSpacing = (canvas.width - pixelWidth * 16) / (COLS + 1);
  pixelVSpacing = (canvas.height - pixelHeight * 16) / (ROWS + 1);
}

resizeCanvas();

window.addEventListener('resize', debounce(resizeCanvas, 250));

const ctx = canvas.getContext('2d');

let frame = 0;

function render() {
  requestAnimationFrame(render);

  if (instance) {
    pixels.fill(0);
    instance.exports.render(frame++);
  }

  ctx.fillStyle = 'black';

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!pixels) {
    return;
  }

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
}

editor.focus();

requestAnimationFrame(render);

refresh();
