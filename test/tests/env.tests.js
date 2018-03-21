'use strict';

const moment = require('moment');
const path   = require('path');
const chai   = require('chai');
const expect = chai.expect;
const P      = require('bluebird');
P.onPossiblyUnhandledRejection(() => {});

chai.should();
chai.use(require('chai-things'));

const t = require(path.resolve('./test/tools'))();

describe('Test environment', () => {
  let _server;

  beforeEach((done) => {
    t.standardSetup()
      .then((server) => {
        _server = server;
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  afterEach((done) => {
    t.standardTearDown(_server)
    .then(() => {
      _server = null;
      done();
    })
    .catch((err) => {
      _server = null;
      done(err);
    });
  });

  it('should be able to get NODE_ENV and dbconfig correct', (done) => {
    let scope;

    t.p().then((s) => {
      scope = s;
    })
    .then(() => {
      expect(t.server.app.NODE_ENV).to.equals('test');
      expect(t.server.app.config).to.deep.equal(t.config);

      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
