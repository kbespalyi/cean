const Joi = require("@hapi/joi");
const UUID = require("uuid");
const Couchbase = require('couchbase');
const N1qlQuery = require("couchbase").N1qlQuery;
const RecordModel = require("../models/recordmodel");

class AppRouter {

  constructor(server) {
    this.server = server;
  }

  async init() {

    const server = this.server;

    this.bucket = server.app.bucket;
    this.cluster = server.app.cluster;
    this.collection = this.bucket.defaultCollection();

    this.recordModel = new RecordModel(server.app);

    server.route({
      method: 'GET',
      path: '/',
      handler: {
        file: 'index.html'
      }
    });

    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: '.',
          listing: true,
          //redirectToSlash: true,
          //index: true,
        }
      }
    });

    server.route({
      method: "GET",
      path: "/people",
      handler: async (request, h) => {

        const query = "SELECT META(person).id, person.firstname, person.lastname, (SELECT address.city, address.state FROM default AS address USE KEYS person.addresses) AS addresses FROM default AS person WHERE person.type=$1";

        let result;
        try {
          result = await this.cluster.query(query, { parameters: ['person']});
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        return h.response(result.rows);
      }
    });

    server.route({
      method: "POST",
      path: "/person",
      config: {
        validate: {
          payload: Joi.object({
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            type: Joi.string().forbidden().default('person'),
            timestamp: Joi.any().forbidden().default((new Date).getTime())
          })
        }
      },
      handler: async (request, h) => {
        const id = UUID.v4();
        let result;
        console.log(this.collection)
        try {
          result = await this.collection.insert(id, request.payload);
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        request.payload.id = id;
        return h.response(request.payload);
      }
    });

    server.route({
      method: "PUT",
      path: "/person/address/{personid}",
      config: {
        validate: {
          payload: Joi.object({
            addressid: Joi.string().required()
          })
        }
      },
      handler: async (request, h) => {

        let result;

        try {
          result = await this.collection
          .mutateIn(request.params.personid, [
            Couchbase.MutateInSpec.arrayAppend(
              'addresses',
              request.payload.addressid,
              {
                createPath: true
              }
            )
          ]);

          try {
            result = await this.collection.get(request.params.personid);
          } catch(error) {
            return h.response({ code: error.code, message: error.message }).code(500);
          }
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        return h.response(result.content);
      }
    });

    server.route({
      method: "POST",
      path: "/address",
      config: {
        validate: {
          payload: Joi.object({
            city: Joi.string().required(),
            state: Joi.string().required(),
            type: Joi.string().forbidden().default("address"),
            timestamp: Joi.any().forbidden().default((new Date).getTime())
          })
        }
      },
      handler: async (request, h) => {
        const id = UUID.v4();

        let result;
        try {
          result = await this.collection.insert(id, request.payload);
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        request.payload.id = id;
        return h.response(request.payload);
      }
    });

    server.route({
      method: "GET",
      path: "/addresses",
      handler: async (request, h) => {
        const query = "SELECT META(address).id, address.* FROM default AS address WHERE address.type=$1";
        let result;
        try {
          result = await this.cluster.query(query, { parameters: ['address']});
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        return h.response(result.rows);
      }
    });

    server.route({
      method: "GET",
      path: "/address/{addressid}",
      handler: async (request, h) => {
        let result;
        try {
          result = await this.collection.get(request.params.addressid);
        } catch(error) {
          return h.response({ code: error.code, message: error.message }).code(500);
        }

        return h.response(result.content);
      }
    });

    /*
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        if (response.isBoom && response.output.statusCode === 404) {
            return h.file('404.html').code(404);
        }

        return h.continue;
    });
    */

  }
}

module.exports = AppRouter;
