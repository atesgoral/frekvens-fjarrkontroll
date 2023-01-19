import {Emitter} from './emitter.js';
import {unindent, format, debounce} from './utils.js';

const emitter = new Emitter();

export const editor = {
  on(event, callback) {
    emitter.on(event, callback);
  },
  init(containerEl) {
    const template = unindent(containerEl.querySelector('#template').innerHTML);
    const sampleCode = unindent(
      containerEl.querySelector('#sample-code').innerHTML,
    );

    const editorEl = containerEl.querySelector('#editor');
    const preambleEl = containerEl.querySelector('#preamble');
    const epilogueEl = containerEl.querySelector('#epilogue');

    const separator = '<<<>>>';
    const [preambleText, epilogueText] = format(template, {
      code: separator,
    }).split(separator);

    preambleEl.appendChild(document.createTextNode(preambleText.trimEnd()));
    editorEl.value = sampleCode;
    epilogueEl.appendChild(document.createTextNode(epilogueText.trimStart()));

    function update() {
      const code = editorEl.value;
      const source = format(template, {code});

      emitter.emit('update', source);
    }

    this.update = update;

    editorEl.addEventListener('keyup', debounce(update, 500));
    editorEl.focus();
  },
};
