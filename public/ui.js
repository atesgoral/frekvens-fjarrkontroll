import {Emitter} from './emitter.js';
import {Button} from './button.js';
import {editor} from './editor.js';
import {display} from './display.js';
import {status} from './status.js';

const emitter = new Emitter();

export const ui = {
  on(event, callback) {
    emitter.on(event, callback);
  },
  init(containerEl) {
    const publishEl = containerEl.querySelector('#publish');
    const editorContainerEl = containerEl.querySelector('#editor-container');
    const displayContainerEl = containerEl.querySelector('#display-container');
    const statusEl = containerEl.querySelector('#status');

    editor.init(editorContainerEl);
    display.init(displayContainerEl);
    status.init(statusEl);

    const publishButton = new Button(publishEl);

    publishButton.on('click', () => emitter.deliver('publish'));

    return {editor, display, status};
  },
};
