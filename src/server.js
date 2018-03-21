let NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  NODE_ENV = 'local';
  process.env.NODE_ENV = NODE_ENV;
}

console.log('Environment: ', process.env.NODE_ENV);

const path = require('path');
const fs = require('fs');
if (fs.existsSync('./.env')) {
  require('dotenv').config();
}

const P = require('bluebird');
P.onPossiblyUnhandledRejection(() => {});
P.config({
  // Enable cancellation.
  cancellation: true,
  // Enable long stack traces. WARNING this adds very high overhead!
  longStackTraces: false,
  monitoring: true,
  // Enable warnings.
  warnings: false
});

const Hapi = require("hapi");
const Inert = require('inert');
const Good = require('good');
const UUID = require("uuid");
const Couchbase = require("couchbase");
const N1qlQuery = Couchbase.N1qlQuery;

const AppRouter = require("./routes/routes.js");

const config = require("./config");
if (process.env.PORT && !isNaN(parseInt(process.env.PORT))) {
  config.backend.port = parseInt(process.env.PORT);
}

let COUCHBASE_USER = process.env.COUCHBASE_USER;
if (!COUCHBASE_USER) {
  COUCHBASE_USER = 'Administrator';
  process.env.COUCHBASE_USER = COUCHBASE_USER;
}

let COUCHBASE_PASS = process.env.COUCHBASE_PASS;
if (!COUCHBASE_PASS) {
  COUCHBASE_PASS = 'password';
  process.env.COUCHBASE_PASS = COUCHBASE_PASS;
}

const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
          relativeTo: path.join(__dirname, (NODE_ENV === 'local' ? '../frontend/dist/' : 'website'))
      }
    }
  }
});

module.exports = server;

server.connection(config.backend);

const couchbase = config.couchbase.server[NODE_ENV];
console.log('Database url: ', couchbase.uri);

const cluster = new Couchbase.Cluster(couchbase.uri);
cluster.authenticate(COUCHBASE_USER, COUCHBASE_PASS);

const bucket = cluster.openBucket(couchbase.uri.bucket, '', (err) => {
  if (err) {
    console.error('Got error: %j', err);
  } else {
    if (NODE_ENV !== 'test') {
      console.log('Couchbase connected.');
    }
  }
});

server.app.bucket = bucket;
server.app.config = config;
server.app.NODE_ENV = NODE_ENV;

const routes = new AppRouter(server);

bucket.manager().createPrimaryIndex(() => {

  bucket.on('error', error => {
      throw error;
  });

  bucket.operationTimeout = 5 * 1000;

  bucket.get('user:king_arthur', function (err, result) {
    if (err || !result || !result.value) {
      bucket.upsert('user:king_arthur', {
        'email': 'kingarthur@couchbase.com', 'interests': ['Holy Grail', 'African Swallows']
      },
      function (err, result) {
        if (err) {
          throw err;
        } else {
          if (NODE_ENV !== 'test') {
            console.log('Got result: %j', result.value);
          }
        }
      });
    } else {
      if (NODE_ENV !== 'test') {
        console.log('Got result: %j', result.value);
      }
      bucket.query(
        N1qlQuery.fromString('SELECT * FROM default WHERE $1 in interests LIMIT 1'),
        ['African Swallows'],
        function (err, rows) {
          if (err) {
            throw err;
          }
          if (NODE_ENV !== 'test') {
            console.log("Got rows: %j", rows.length);
          }
        });
    }
  });
});

const provision = async (cb) => {

  if (!server.app.started) {
    server.register.attributes = {
      pkg: {
          name: "CEAN",
          version: "1.0.0"
      }
    }

    await server.register(Inert);

    server.register({
        register: Good,
        options: {
            reporters: {
                console: [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{
                        response: '*',
                        log: '*'
                    }]
                }, {
                    module: 'good-console'
                }, 'stdout']
            }
        }
    });

    await routes.init();
  }

  // start the web server
  await server.start();

  if (NODE_ENV !== 'test') {
    server.log('info', `Server running at: ${server.info.uri}`);
  }

  if (cb) {
    cb(server);
  }

  server.app.started = true;

};

server.app.startRestApp = (cb) => {
  provision(cb);
}

if (NODE_ENV !== 'test') {

  provision();

  // listen on SIGINT signal and gracefully stop the server
  process.on('SIGINT', () => {
    console.log('Stopping hapi server...');
    server.stop({ timeout: 10000 })
      .then((err) => {
        console.log('Server stopped!')
        process.exit((err) ? 1 : 0)
      })
  });
}
