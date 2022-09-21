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

describe('Test environment', async () => {
  let _server;

  beforeEach(async () => {
    await t.standardSetup()
      .then((server) => {
        _server = server;
      })
      .catch((err) => {
        throw err;
      });
  });

  afterEach(async () => {
    await t.standardTearDown(_server)
    .then(() => {
      _server = null;
    })
    .catch((err) => {
      _server = null;
      throw err;
    });
  });

  it('should be able to get NODE_ENV and dbconfig correct', async () => {
    let scope;

    await t.p().then((s) => {
      scope = s;
    })
    .then(() => {
      expect(t.server.app.NODE_ENV).to.equals('test');
      expect(t.server.app.config).to.deep.equal(t.config);

      scope = null;
    })
    .catch((err) => {
      scope = null;
      throw err;
    });
  });
});
