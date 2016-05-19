var MongoClient = require('mongodb').MongoClient,
    url = 'mongodb://localhost:27017/messenger',
    randomstring = require("randomstring"),
    ObjectId = require('mongodb').ObjectID,
    con,
    clientsCollection;

var db = {
    initDb: function (success, failure) {
        MongoClient.connect(url, function (err, _db) {
            if (!err) {
                con = _db;
                clientsCollection = con.collection('clients');
                success();
            } else {
                failure(err);
            }
        });
    },
    registerClient: function (success, error) {
        clientsCollection.insertOne({
            status: 'online'
        }, function (err, result) {
            if (!err) {
                success(result.insertedId);
            } else {
                error(err);
            }
        });
    },
    checkLogin: function (uniqueId, success, error) {
        clientsCollection.find({_id: ObjectId(uniqueId)}).toArray(function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    clientsCollection.updateOne({_id: ObjectId(uniqueId)}, {$set: {status: 'online'}}, function (err) {
                        if (!err) {
                            success();
                        } else {
                            error(err);
                        }
                    });
                } else {
                    error('Client not found.');
                }
            } else {
                error(err);
            }

        });
    },
    goOffline: function (uniqueId, success, error) {
        clientsCollection.updateOne({_id: ObjectId(uniqueId)}, {$set: {status: 'offline'}}, function (err) {
            if (!err) {
                success();
            } else {
                error(err);
            }
        });
    },
    getStatuses: function (contacts, success, error) {
        contacts = contacts.map(function (id) {
            return ObjectId(id);
        });
        clientsCollection.find({
            _id: {$in: contacts}
        }).toArray(function (err, docs) {
            if (!err) {
                docs = docs.map(function (doc) {
                    doc.id = doc._id.toString();
                    delete doc._id;
                    return doc;
                });
                success(docs);
            } else {
                error(err);
            }
        });
    }
};


module.exports = db;