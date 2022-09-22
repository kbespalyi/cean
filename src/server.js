const CIRCLECI = process.env.CIRCLECI;
const DEBUG = process.env.DEBUG;

CIRCLECI === 'true' && console.log('Test in CircleCI');
DEBUG === 'true' && console.log('Debug enabled');

let NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  NODE_ENV = 'local';
  process.env.NODE_ENV = NODE_ENV;
}

console.log('Node environment:', NODE_ENV);

const isLocal = (NODE_ENV === 'local');
const isTest = (NODE_ENV === 'test' || CIRCLECI === 'true');
const isDev = (NODE_ENV === 'dev');
const isProd = (NODE_ENV === 'production');
const isDebug = (DEBUG === 'true');

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

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Couchbase = require('couchbase');

const AppRouter = require('./routes/routes.js');

const config = require('./config');

if (process.env.PORT && !isNaN(parseInt(process.env.PORT))) {
  config.backend.port = parseInt(process.env.PORT);
}

let COUCHBASE_USER = process.env.COUCHBASE_USER;
let COUCHBASE_PASS = process.env.COUCHBASE_PASS;

if (isProd || isDev) {
  COUCHBASE_USER = process.env.CLUSTER_USERNAME;
  COUCHBASE_PASS = process.env.CLUSTER_PASSWORD;
}

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

module.exports = server;

async function handleConnections() {

  const couchbaseConfig = config.couchbase.server[NODE_ENV];
  isTest || server.log('info', ['Connecting to database ', couchbaseConfig.uri]);

  const time = (isTest ? 0 : isProd ? 20000 : 1000);
  isTest || server.log('info', [' - waiting before connecting: ', time, ' ms']);

  return P.delay(time)
    .then(() => {
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
      
              await P.delay(100);
      
              let result;
      
              !isDebug || server.log('info', 'DB: Testing data...');
      
              try {
                result = await collection.get('user:king_arthur');
              } catch (err) {
                result = null;
              }
      
              if (!result || !result.content) {
                try {
                  result = await collection.upsert(
                    'user:king_arthur', {
                      'email': 'kingarthur@couchbase.com',
                      'interests': ['Holy Grail', 'African Swallows']
                    },
                    { timeout: 5 * 1000}
                  );
      
                  !isDebug || server.log('info',`DB: Created the test record...`);
                } catch(err) {
                  server.log('error', err);
                }
              } else {
                !isDebug || server.log('info', `DB: Retrieved the test record: ${JSON.stringify(result.content)}`);
              }
      
              try {
                result = await cluster.query(
                  'SELECT * FROM default WHERE $1 in interests LIMIT 1',
                  { parameters: ['African Swallows'] }
                );
      
                !isDebug || server.log('info',`DB: Retrieved the test rows: ${result.rows.length}`);
              } catch(err) {
                server.log('error', err);
              }
      
              !isDebug || server.log('info', 'DB: Testing has done.');
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
    })
    .catch(() => {})
}

process.on('unhandledRejection', (error) => {
  console.log(error);
  process.exit(1);
});

// listen on SIGINT signal and gracefully stop the server
process.on('SIGINT', () => {
  console.log('Stopping hapi server...');
  server.stop({ timeout: 5000 })
    .then((error) => {
      if (server.app && server.app.cluster) {
        return server.app.cluster
          .close()
          .then(() => {
            console.log('Couchbase closed!')
            return error
          });
      }
    })
    .then((error) => {
      console.log('Server stopped!')
      process.exit((error) ? 1 : 0)
    })
});

handleConnections();