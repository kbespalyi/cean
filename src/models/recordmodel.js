const UUID = require('uuid');
//const db = require("../server").bucket;
const N1qlQuery = require('couchbase').N1qlQuery;

class RecordModel {

  constructor(app) {
    this.config = app.config;
    this.collection = app.collection;
  }

  save(data, callback) {
    const jsonObject = {
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email
    }
    const documentId = data.document_id ? data.document_id : UUID.v4();
    this.collection.upsert(documentId, jsonObject, function(error, result) {
      if(error) {
        callback(error, null);
        return;
      }
      callback(null, {message: "success", data: result});
    });
  }

  getByDocumentId(documentId, callback) {
    const query = "SELECT firstname, lastname, email "
      + "FROM `" + this.config.couchbase.bucket + "` AS users "
      + "WHERE META(users).id = $1";
    this.collection.query(query, { parameters: [documentId]}, function(error, result) {
        if(error) {
          return callback(error, null);
        }
        callback(null, result);
    });
  }

  delete(documentId, callback) {
    this.collection.remove(documentId, function(error, result) {
      if(error) {
        callback(error, null);
        return;
      }
      callback(null, { message: 'success', data: result });
    });
  }

  getAll(callback) {
    const query = "SELECT META(users).id, firstname, lastname, email "
      + "FROM `" + this.config.couchbase.bucket + "` AS users";
    this.collection.query(query, { parameters: []}, function(error, result) {
      if(error) {
        return callback(error, null);
      }
      callback(null, result);
    });
  }
}

module.exports = RecordModel;
