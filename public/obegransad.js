import {client} from './client.js';
import {ui} from './ui.js';
import {compile, instantiate, hexDump} from './as.js';
import {chunks} from './utils.js';

const {editor, display, status} = ui.init(document);

client.init(io());

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

    console.log(hexDump(binary));

    status.set('Instantiating');
    instance = await instantiate(binary);

    pixels = new Uint8Array(instance.exports.memory.buffer);

    status.clear();
  } catch (error) {
    status.set(`${error.message} (${error.cause?.message})`, {error: true});
  }
}

editor.on('update', (source) => update(source));
editor.update();

ui.on('publish', async () => {
  for (const chunk of chunks(binary, 256)) {
    await client.deliver('binary', Array.from(chunk));
  }
});

let frame = 0;

function render() {
  requestAnimationFrame(render);

  if (!pixels) {
    return;
  }

  if (instance) {
    pixels.fill(0);
    instance.exports.render(frame++);
  }

  display.render(pixels);
}

requestAnimationFrame(render);
