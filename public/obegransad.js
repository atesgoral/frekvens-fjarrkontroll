import {client} from './client.js';
import {ui} from './ui.js';
import {compile, instantiate, hexDump} from './as.js';

const {editor, display, status} = ui.init(document);

client.init(io());

client.on('connect', () => console.log('Connected'));
client.on('disconnect', () => console.log('Disconnected'));

let instance = null;
let pixels = null;

async function update(source) {
  try {
    pixels = null;

    status.set('Compiling');
    const binary = await compile(source);

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
