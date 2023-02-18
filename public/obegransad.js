import {client} from './client.js';
import {ui} from './ui.js';
import {compile, instantiate, hexDump} from './as.js';
import {chunks, encode} from './utils.js';

const {editor, display, status} = ui.init(document);

client.init(window.io());

client.on('connect', () => console.log('Connected'));
client.on('disconnect', () => console.log('Disconnected'));

let instance = null;
let binary = null;
let pixels = null;

async function update(source) {
  try {
    pixels = null;

    status.set('Compiling');
    binary = await compile(source);

    // console.log(hexDump(binary));

    status.set('Instantiating');
    instance = await instantiate(binary);

    instance.exports.setup();

    pixels = new Uint8Array(instance.exports.memory.buffer, 0, 256);

    status.clear();
  } catch (error) {
    status.set(`${error.message} (${error.cause?.message})`, {error: true});
  }
}

editor.on('update', (source) => update(source));
editor.update();

const CHUNK_SIZE = 3 * 100;

ui.on('publish', async () => {
  client.emit('binaryBegin', (binary.length / CHUNK_SIZE) | 0);

  for (const chunk of chunks(binary, CHUNK_SIZE)) {
    // await client.deliver('binary', await encode(chunk));
    client.emit('binaryChunk', await encode(chunk));
  }

  client.emit('binaryEnd');
});

let frame = 0;

function render() {
  requestAnimationFrame(render);

  if (!pixels) {
    return;
  }

  if (instance) {
    pixels.fill(0);
    // console.log(instance.exports.test(frame), Math.sin((frame / 60) * 1.1));
    instance.exports.render(frame++);
  }

  display.render(pixels);
}

requestAnimationFrame(render);
