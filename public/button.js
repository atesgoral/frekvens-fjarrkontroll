import {Emitter} from './emitter.js';

export class Button {
  constructor(el) {
    const emitter = new Emitter();

    this.on = emitter.on.bind(emitter);

    el.addEventListener('click', () => {
      el.setAttribute('disabled', true);
      emitter.emit('click', () => el.removeAttribute('disabled'));
    });
  }
}
