var db = require('./db'),
    comm = require('./communication');

db.initDb(function () {
    comm.createServer(db);
}, function (err) {
    console.error(err);
});
