const CIRCLECI = process.env.CIRCLECI;
const DEBUG = process.env.DEBUG;
CIRCLECI === 'true' && console.log('Test in CircleCI');
DEBUG === 'true' && console.log('Debug enabled');

let NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  NODE_ENV = 'local';
  process.env.NODE_ENV = NODE_ENV;
}

console.log('Node environment:', process.env.NODE_ENV);

const path = require('path');
const fs = require('fs');

if (NODE_ENV === 'local') {
  if (fs.existsSync('./.env')) {
    require('dotenv').config();
  }
}

const isLocal = (NODE_ENV === 'local');
const isTest = (NODE_ENV === 'test' || CIRCLECI === 'true');
const isDebug = (DEBUG === 'true');

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

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const UUID = require('uuid');

const Couchbase = require('couchbase');
const N1qlQuery = Couchbase.N1qlQuery;

const AppRouter = require('./routes/routes.js');

const config = require('./config');

if (process.env.PORT && !isNaN(parseInt(process.env.PORT))) {
  config.backend.port = parseInt(process.env.PORT);
}

let COUCHBASE_USER = process.env.COUCHBASE_USER;
let COUCHBASE_PASS = process.env.COUCHBASE_PASS;

if (isTest) {
  if (!COUCHBASE_USER) {
    COUCHBASE_USER = 'admin';
  }

  if (!COUCHBASE_PASS) {
    COUCHBASE_PASS = 'admin001*';
  }
} else if (isLocal) {
  if (!COUCHBASE_USER) {
    COUCHBASE_USER = 'Administrator';
  }

  if (!COUCHBASE_PASS) {
    COUCHBASE_PASS = 'password';
  }
} else {
  if (!COUCHBASE_USER) {
    COUCHBASE_USER = 'admin';
  }

  if (!COUCHBASE_PASS) {
    COUCHBASE_PASS = 'admin001*';
  }
}

process.env.COUCHBASE_USER = COUCHBASE_USER;
process.env.COUCHBASE_PASS = COUCHBASE_PASS;

const connection = config.backend
if (connection.routes) {
  connection.routes.files = {
    relativeTo: path.join(__dirname, (NODE_ENV === 'local' ? '../frontend/dist/' : 'website'))
  }
} else {
  connection.routes = {
    files: {
      relativeTo: path.join(__dirname, (NODE_ENV === 'local' ? '../frontend/dist/' : 'website'))
    }
  }
}
if (isTest || NODE_ENV === 'local') {
  connection.debug = {
    request: ['error']
  }
}

const server = new Hapi.Server(connection);
const routes = new AppRouter(server);

server.app.NODE_ENV = NODE_ENV;
server.app.config = config;
server.app.isDebug = isDebug;
server.app.isTest = isTest;

server.events.on('log', (event, tags) => {
  if (tags.error) {
    console.error(`Server error: ${event.error ? event.error.message : (event.data || 'unknown')}`);
  } else if (tags.info) {
    if (event.data && Array.isArray(event.data)) {
      let message = ''
      for (ms of event.data) {
        message += ms
      }
      console.warn(message);
    } else {
      console.warn(event.data || '');
    }
  }
});

/*
server.events.on('error', (error) => {
  server.log('error', error)
  process.exit(1);
});
*/

module.exports = server;

const couchbaseConfig = config.couchbase.server[NODE_ENV];
isTest || server.log('info', ['Connecting to database ', couchbaseConfig.uri]);

Couchbase.connect(couchbaseConfig.uri, {
  username: COUCHBASE_USER,
  password: COUCHBASE_PASS
}, async (error, cluster) => {

  if (error) {
    server.log('error', new Error('No connection to Couchbase'));
    process.exit(1);
    return;
  }

  if (server.app.bucket) {
    return;
  }

  const bucket = cluster.bucket(couchbaseConfig.bucket);  
  const collection = bucket.defaultCollection();
  
  server.app.bucket = bucket;
  server.app.cluster = cluster;

  isTest || server.log('info', 'Couchbase connected!');

  const provision = async (cb) => {

    if (!server.app.started) {
      server.register.attributes = {
        pkg: {
            name: "CEAN",
            version: "2.0.0"
        }
      }
  
      await server.register(Inert);
      await routes.init();
    }
  
    // start the web server
    isTest || server.log('info', 'Starting web-server...')

    try {
      await server.start();
      
      isTest || server.log('info', `Server running at: ${server.info.uri}`);
  
      if (cb) {
        cb(server);
      }
    
      server.app.started = true;

    } catch (error) {
      if (error) {
        server.log('error', new Error('Server not started!!'));
        process.exit(1);
        return;    
      }
    }
  };

  async function checkDatabase () {
    await cluster.queryIndexes().createPrimaryIndex(
      couchbaseConfig.bucket,
      { ignoreIfExists: true },
      async () => {  
        let result;

        !isDebug || server.log('info', 'Testing data...');

        try {
          result = await collection.get('user:king_arthur');
          if (!result || !result.content) {
            try {
              result = await collection.upsert(
                'user:king_arthur', {
                  'email': 'kingarthur@couchbase.com',
                  'interests': ['Holy Grail', 'African Swallows']
                },
                { timeout: 5 * 1000}
              );

              !isDebug || server.log('info', `Got result: ${JSON.stringify(result.content)}`);
            } catch(err2) {
              server.log('error', err2);
            }
          } else {
            !isDebug || server.log('info', `Got result: ${JSON.stringify(result.content)}`);
            try {
              result = await cluster.query(
                'SELECT * FROM default WHERE $1 in interests LIMIT 1',
                { parameters: ['African Swallows'] }
              );

              !isDebug || server.log('info',`Got rows: ${result.rows.length}`);
            } catch(err2) {
              server.log('error', err2);
            }
          }
        } catch (err) {
          server.log('error', err);
        }

        !isDebug || server.log('info', 'Testing has done.');
      }
    );
  }
  
  await checkDatabase();

  if (isTest) {
    server.app.startRestApp = (cb) => {
      provision(cb);
    }
  } else {
    provision();
  }
});

process.on('unhandledRejection', (error) => {
  console.log(error);
  process.exit(1);
});

// listen on SIGINT signal and gracefully stop the server
process.on('SIGINT', () => {
  if (server.app && server.app.cluster) {
    server.app.cluster.close();
  }
  console.log('Stopping hapi server...');
  server.stop({ timeout: 10000 })
    .then((error) => {
      console.log('Server stopped!')
      process.exit((error) ? 1 : 0)
    })
});
