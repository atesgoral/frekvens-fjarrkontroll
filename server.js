const http = require('http');
const crypto = require('crypto');
const {spawn} = require('child_process');

const express = require('express');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.post(
  '/deployhook',
  bodyParser.text({type: 'application/json'}),
  (request, response) => {
    console.log('Received deploy hook');

    const expectedHmac = crypto
      .createHmac('sha1', process.env.DEPLOY_HOOK_SECRET)
      .update(request.body)
      .digest('hex');

    const signature = request.get('X-Hub-Signature');
    const match = /^sha1=(.+)$/.exec(signature);

    if (match) {
      const hmac = match[1];

      if (hmac !== expectedHmac) {
        console.log('Unauthorized');
        response.status(403).end();
      } else {
        if (process.env.ENVIRONMENT === 'production') {
          console.log('Updating in the background');

          const child = spawn('./update.sh');

          child.stdout.setEncoding('utf8');
          child.stderr.setEncoding('utf8');

          child.stdout.on('data', (chunk) => {
            console.log(chunk);
          });

          child.stderr.on('data', (chunk) => {
            console.error(chunk);
          });

          child.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
          });
        } else {
          console.log('Not doing anything');
        }

        response.status(204).end();
      }
    } else {
      console.log('HMAC not found');
      response.status(400).end();
    }
  },
);

app.post(
  '/ifttthook',
  bodyParser.json({type: 'application/json'}),
  (request, response) => {
    console.log('Received IFTTT hook');

    const authorization = request.get('Authorization');
    const {activateScene} = request.body;

    if (authorization !== `Basic ${process.env.IFTTT_HOOK_SECRET}`) {
      console.log('Unauthorized');
      response.status(401).end();
      return;
    }

    if (activateScene) {
      console.log('Activating scene', activateScene);
      io.emit('activate', activateScene);
    }

    response.status(204).end();
  },
);

app.get('/as.html', (_req, res) => {
  res.redirect('/obegransad.html');
});

app.use(express.static('public'));
app.use('/modules', express.static('node_modules'));

const ui = {socket: null};

let timeSyncInterval = null;
let latency = 0;
let syncDelta = 0;

io.on('connection', (socket) => {
  socket.on('sync', (syncInfo) => {
    syncInfo.server = Date.now();
    syncInfo.frekvens = {
      latency,
      syncDelta,
    };
    socket.emit('syncResponse', syncInfo);
  });

  socket.on('identify', (secret) => {
    if (secret === process.env.FREKVENS_CLIENT_SECRET) {
      console.log('FREKVENS authorized');

      timeSyncInterval = setInterval(() => {
        socket.emit('sync', {client: Date.now()});
      }, 1000);

      socket.on('syncResponse', (syncInfo) => {
        const now = Date.now();
        latency = (now - syncInfo.client) / 2;

        syncDelta = syncInfo.server - now + latency;
      });

      socket.on('disconnect', () => clearInterval(timeSyncInterval));
    } else if (secret === process.env.UI_CLIENT_SECRET) {
      console.log('UI authorized');

      ui.socket = socket;

      socket.emit('drive');

      socket.on('script', (script) => {
        socket.broadcast.emit('script', script);
      });

      socket.on('binaryBegin', (chunkCount) => {
        socket.broadcast.emit('binaryBegin', chunkCount);
      });

      socket.on('binaryChunk', (chunk) => {
        socket.broadcast.emit('binaryChunk', chunk);
      });

      socket.on('binaryEnd', () => {
        socket.broadcast.emit('binaryEnd');
      });

      socket.on('yellowDown', () => socket.broadcast.emit('yellowDown'));
      socket.on('yellowUp', () => socket.broadcast.emit('yellowUp'));
      socket.on('redDown', () => socket.broadcast.emit('redDown'));
      socket.on('redUp', () => socket.broadcast.emit('redUp'));

      socket.on('midi', (message) => socket.broadcast.emit('midi', message));

      socket.on('disconnect', () => {
        ui.socket = null;
      });
    } else {
      console.log('Unauthorized');
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log('Listening on', process.env.PORT);
});
