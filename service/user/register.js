var express = require('express');
var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var router = express.Router();

const connection = closure => mongoClient.connect(process.env.DATABASE, {
    useNewUrlParser: true
}, (err, client) => {
    if (err) console.log(err);
    const db = client.db('lof_workplace');
    closure(db, client);
});

module.exports = router;
