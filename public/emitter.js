export class Emitter {
  constructor() {
    this.eventTarget = new EventTarget();
  }

  on(eventName, callback) {
    this.eventTarget.addEventListener(eventName, (event) => {
      const {data, resolve, reject} = event.detail;
      const result = callback(data);
      result?.then?.(resolve, reject);
    });
  }

  emit(eventName, data) {
    this.eventTarget.dispatchEvent(
      new CustomEvent(eventName, {detail: {data}}),
    );
  }

  async deliver(eventName, data) {
    return new Promise((resolve, reject) => {
      this.eventTarget.dispatchEvent(
        new CustomEvent(eventName, {detail: {data, resolve, reject}}),
      );
    });
  }
}
