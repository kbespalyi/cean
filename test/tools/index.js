'use strict';

module.exports = () => {
  process.setMaxListeners(0);
  require('events').EventEmitter.prototype.setMaxListeners(100);

  const crypto = require('crypto');
  const path = require('path');
  const fs = require('fs');
  const P = require('bluebird');
  P.onPossiblyUnhandledRejection(() => {});

  const server = require(path.resolve(__dirname, '../../src/server.js'));

  const output = {
    server,
    p: () => P.resolve()
  };

  output.startServer = () => new P(
    (resolve) => {
      output.server.app.startRestApp((_server) => {
        resolve(_server);
      });
    }
  );

  output.standardSetup = () => {
    // If no config have to read firstly
    if (!output.config) {

      if (process.env.NODE_ENV !== 'test') {
        throw new Error('Invalid NODE_ENV');
      }

      const config = require("../../src/config");
      if (config.couchbase && config.couchbase.server) {
        const couchbase = config.couchbase.server[process.env.NODE_ENV];
        if (couchbase) {
          if (couchbase.uri !== 'couchbase://localhost' || couchbase.bucket !== 'default') {
            throw new Error('Invalid DB config');
          }
        } else {
          throw new Error('Invalid config.json:couchbase');
        }
      }

      const backend = config.backend;
      if (backend) {
        if (backend.host !== '127.0.0.1' || backend.port !== 5400) {
          throw new Error('Invalid backend HOST or PORT');
        }
      } else {
        throw new Error('Invalid config.json:backend');
      }

      output.config = config;
    } else {
      throw new Error('No found the config.json');
    }

    return output.p()
      .delay(100)
      .then(() => output.startServer())
      .then((_server) => {
        return _server;
      })
      .catch(err => {
        throw new Error(err);
      });
  };

  output.standardTearDown = (_server) => output.p()
    .then(() => {
      if (_server) {
        _server
          .stop({ timeout: 500 })
          .then((err) => {
            _server = null;
          })
          .catch((err) => {
            _server = null;
          })
      } else {
        console.log('Hapi server was not started');
      }
    })
    .delay(500)
    .then(() => {
      output.server = null;
    })
    .catch((err) => {
      throw new Error(err);
    });

  return output;
};
