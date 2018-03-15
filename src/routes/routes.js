const Joi = require("joi");
const UUID = require("uuid");
const N1qlQuery = require("couchbase").N1qlQuery;
const RecordModel = require("../models/recordmodel");

class AppRouter {

  constructor(server) {
    this.server = server;
    this.bucket = server.app.bucket;
    this.recordModel = new RecordModel(server.app);
  }

  async init() {

    const server = this.server;

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
        handler: (request, response) => {
            const statement = "SELECT META(person).id, person.firstname, person.lastname, (SELECT address.city, address.state FROM default AS address USE KEYS person.addresses) AS addresses FROM default AS person WHERE person.type = 'person'";
            const query = N1qlQuery.fromString(statement);
            this.bucket.query(query, (error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                response(result);
            });
        }
    });

    server.route({
        method: "POST",
        path: "/person",
        config: {
            validate: {
                payload: {
                    firstname: Joi.string().required(),
                    lastname: Joi.string().required(),
                    type: Joi.string().forbidden().default("person"),
                    timestamp: Joi.any().forbidden().default((new Date).getTime())
                }
            }
        },
        handler: (request, response) => {
            var id = UUID.v4();
            this.bucket.insert(id, request.payload, (error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                request.payload.id = id;
                response(request.payload);
            });
        }
    });

    server.route({
        method: "PUT",
        path: "/person/address/{personid}",
        config: {
            validate: {
                payload: {
                    addressid: Joi.string().required()
                }
            }
        },
        handler: (request, response) => {
            this.bucket.mutateIn(request.params.personid).arrayAppend("addresses", request.payload.addressid, true).execute((error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                this.bucket.get(request.params.personid, (error, result) => {
                    if(error) {
                        return response({ code: error.code, message: error.message }).code(500);
                    }
                    response(result.value);
                });
            });
        }
    });

    server.route({
        method: "POST",
        path: "/address",
        config: {
            validate: {
                payload: {
                    city: Joi.string().required(),
                    state: Joi.string().required(),
                    type: Joi.string().forbidden().default("address"),
                    timestamp: Joi.any().forbidden().default((new Date).getTime())
                }
            }
        },
        handler: (request, response) => {
            var id = UUID.v4();
            this.bucket.insert(id, request.payload, (error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                request.payload.id = id;
                response(request.payload);
            });
        }
    });

    server.route({
        method: "GET",
        path: "/addresses",
        handler: (request, response) => {
            var statement = "SELECT META(address).id, address.* FROM default AS address WHERE address.type = 'address'";
            var query = N1qlQuery.fromString(statement);
            this.bucket.query(query, (error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                response(result);
            });
        }
    });

    server.route({
        method: "GET",
        path: "/address/{addressid}",
        handler: (request, response) => {
            this.bucket.get(request.params.addressid, (error, result) => {
                if(error) {
                    return response({ code: error.code, message: error.message }).code(500);
                }
                response(result.value);
            });
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
