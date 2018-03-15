const UUID = require("uuid");
//const db = require("../server").bucket;
const N1qlQuery = require('couchbase').N1qlQuery;

class RecordModel {

  constructor(app) {
    this.config = app.config;
    this.db = app.bucket;
  }

  save(data, callback) {
      const jsonObject = {
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email
      }
      const documentId = data.document_id ? data.document_id : UUID.v4();
      this.db.upsert(documentId, jsonObject, function(error, result) {
          if(error) {
              callback(error, null);
              return;
          }
          callback(null, {message: "success", data: result});
      });
  }

  getByDocumentId(documentId, callback) {
    const statement = "SELECT firstname, lastname, email " +
                    "FROM `" + this.config.couchbase.bucket + "` AS users " +
                    "WHERE META(users).id = $1";
    const query = N1qlQuery.fromString(statement);
    this.db.query(query, [documentId], function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
  }

  delete(documentId, callback) {
    this.db.remove(documentId, function(error, result) {
        if(error) {
            callback(error, null);
            return;
        }
        callback(null, {message: "success", data: result});
    });
  }

  getAll(callback) {
    const statement = "SELECT META(users).id, firstname, lastname, email " +
                    "FROM `" + this.config.couchbase.bucket + "` AS users";
    const query = N1qlQuery.fromString(statement).consistency(N1qlQuery.Consistency.REQUEST_PLUS);
    this.db.query(query, function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
  }

}

module.exports = RecordModel;
