const express = require('express'),
      socketio = require('socket.io');
var app = express();
var server = app.listen(8080);
var io = socketio(server);

app.use(express.static(__dirname + '/node_modules')); 

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/static/index.html');    
});


console.log("Server stared on port 8080");

SocketList = {};


var lobbyUsers = { user: [] };

io.on('connection', (socket) => {
    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

});

var User = function (socket, username)
{
    var self = {
        id: socket.id,
        username: username,
    };

    self.getInfo = function () 
    {
        return {
            id: self.id,
            username: self.username,
        };
    }

    //Adds new user to user list
    User.list[self.id] = self;
    lobbyUsers.user.push(self.getInfo());
    return self;
}

User.list = {};

//Used when user connects
User.connection = function (socket, username)
{
    var user = User(socket, username);
    socket.emit('initLobbyUser', {
        id: socket.id,
        user: User.getAllUserInfo(),
    });
}

//Runs every frame
User.update = function ()
{
    var updatedUsers = [];
    for (var i in User.list)
    {
        var user = User.list[i];
        updatedUsers.push(user.getInfo());
    }

    return updatedUsers;
}


User.getAllUserInfo = function ()
{
    var users = [];
    for (var i in User.list) {
        users.push(User.list[i].getInfo());
    }

    return users;
}