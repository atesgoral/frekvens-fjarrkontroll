export class Emitter {
  constructor() {
    this.eventTarget = new EventTarget();
  }

  on(eventName, callback) {
    this.eventTarget.addEventListener(eventName, (event) =>
      callback(event.detail),
    );
  }

  emit(eventName, data) {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, {detail: data}));
  }
}
