var sockets = [],
    io,
    db;
var comm = {
    createServer: function(_db){
        db = _db;
        io = require('socket.io').listen(7979);
        io.on('connection', function(sock){
            console.log('new client connected');
            var query = sock.handshake.query;
            if(query.hasOwnProperty('uniqueId')) {
                //TODO: check for subscribers
                db.checkLogin(query.uniqueId, function(){
                    sock.emit('login', {
                        status: 'success',
                        uniqueId: query.uniqueId
                    });
                }, function(){
                    sock.emit('login', {
                        status: 'failure',
                        reason: 'client not found'
                    });
                    sock.disconnect();
                });
            } else {
                db.registerClient(function(uniqueId){
                    sock.uniqueId = uniqueId;
                    sockets.push(sock);
                    sock.emit('login', {
                        status: 'success',
                        uniqueId: uniqueId
                    });
                    comm.subscribeSocket(sock);
                }, function(){
                    sock.disconnect();
                })
            }
        });
    },
    subscribeSocket: function(sock) {
        sock.on('disconnect', comm.disconnect);
        sock.on('getStatuses', comm.getStatuses);
        sock.on('subscribeToContacts', comm.subscribeToContacts);
        sock.on('subscribeToContact', comm.subscribeToContact);
        sock.on('getContactIP', comm.getContactIp);
        sock.on('sendIPForContact', comm.sendIPForContact);
    },
    disconnect: function(){
        db.goOffline(this.uniqueId, function(){}, function(err){
            console.error(err);
        });

        for(var i=0;i<sockets.length;i++) {
            if(sockets[i] == this) {
                sockets.splice(i, 1);
                break;
            }
        }

        for(var i=0;i<sockets.length;i++) {
            if(sockets[i].hasOwnProperty('subscriptions')) {
                for(var j=0;j<sockets[i]['subscriptions'].length;j++) {
                    if(this.uniqueId == sockets[i]['subscriptions'][j]) {
                        //TODO: remove contact from subs
                        sockets[i].emit('contactUpdate', {
                            status: 'offline'
                        });
                    }
                }
            }
        }

        console.log('client disconnected!');

    },
    getStatuses: function(contacts){
        db.getStatuses(contacts, function(docs){
            this.emit('statuses', docs);
        }, function(err){
            console.error(err);
        })
    },
    subscribeToContacts: function(contacts){
        this.subscriptions = contacts;
    },
    subscribeToContact: function(contact){
        if(!this.hasOwnProperty('subscriptions')) {
            this.subscriptions = [];
        }

        this.subscriptions.push(contact);
    },
    getContactIp: function(contact){
        var contactSocket = comm.getSocketById(contact);
        if(contactSocket) {
            contactSocket.emit('getContactIp', {
                forContact: this.uniqueId
            });
        } else {
            this.emit('sendIPForContact', {
                status: 'failure',
                reason: 'Contact is offline'
            });
        }
    },
    sendIPForContact: function(data){
        if(data.hasOwnProperty('forContact')) {
            var contactSocket = comm.getSocketById(data.forContact);
            if(contactSocket) {
                this.emit('sendIPForContact', {
                    status: 'success',
                    data: data
                });
            }
        }
    },
    getSocketById: function(id){
        for(var i=0;i<sockets.length;i++) {
            if(id == sockets.uniqueId) {
                return sockets[i];
            }
        }

        return false;
    }

};

module.exports = comm;