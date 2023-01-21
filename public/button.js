import {Emitter} from './emitter.js';

export class Button {
  constructor(el) {
    const emitter = new Emitter();

    this.on = emitter.on.bind(emitter);

    el.addEventListener('click', async () => {
      el.setAttribute('disabled', true);
      await emitter.deliver('click');
      el.removeAttribute('disabled');
    });
  }
}
