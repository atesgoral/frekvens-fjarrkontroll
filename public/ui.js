import {editor} from './editor.js';
import {display} from './display.js';
import {status} from './status.js';

export const ui = {
  init(containerEl) {
    const editorContainerEl = containerEl.querySelector('#editor-container');
    const displayContainerEl = containerEl.querySelector('#display-container');
    const statusEl = containerEl.querySelector('#status');

    editor.init(editorContainerEl);
    display.init(displayContainerEl);
    status.init(statusEl);

    return {editor, display, status};
  },
};
