import {Emitter} from './emitter.js';

const emitter = new Emitter();

function getSecret() {
  const matches = /secret=(.+)/.exec(document.cookie);

  if (matches) {
    const [_, secret] = matches;
    return secret;
  }
}

export const client = {
  on(event, callback) {
    emitter.on(event, callback);
  },
  init(socket) {
    let timeSyncInterval = null;

    socket = window.io();

    this.emit = socket.emit.bind(socket);

    this.deliver = async (event, data) => {
      return new Promise((resolve, reject) => {
        socket.emit(event, data, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    };

    socket.on('connect', () => {
      emitter.emit('connect');

      const secret = getSecret();

      if (secret) {
        socket.emit('identify', secret);
      }

      timeSyncInterval = setInterval(() => {
        socket.emit('sync', {client: Date.now()});
      }, 1000);
    });

    socket.on('disconnect', () => {
      emitter.emit('disconnect');
      clearInterval(timeSyncInterval);
    });

    socket.on('syncResponse', (syncInfo) => {
      const now = Date.now();
      const latency = (now - syncInfo.client) / 2;

      let syncDelta = syncInfo.server - now + latency;

      syncDelta += syncInfo.obegransad.syncDelta;
      const epoch = syncInfo.obegransad.epoch;

      emitter.emit('sync', {syncDelta, epoch});
    });

    socket.on('drive', () => emitter.emit('drive'));
    socket.on('script', (script) => emitter.emit('script', script));
  },
};
