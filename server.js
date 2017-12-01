const express = require('express'),
      socketio = require('socket.io');
var app = express();
var server = app.listen(8080);
var io = socketio(server);

app.use(express.static(__dirname + '/public')); 

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/static/index.html');    
});


console.log("Server stared on port 8080");

SocketList = {};


var lobbyUsers = { user: [] };
var removeLobbyUsers = { user: [] };

io.on('connection', (socket) => {
    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

    socket.on('checkUsername', function (uname) {
       var unames = [];

        for (i in User.list) {
            unames.push(User.list[i].username);
        }
       
        if (unames.length < 1)
        {            
            socket.emit('checkUsernameResponse', { success: true, uname: uname });
            User.connection(socket, uname);
        } else {

            if (unames.includes(uname))
            {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });
                
            } else {
                socket.emit('checkUsernameResponse', { success: true, uname: uname });
                User.connection(socket, uname);                
            }           
        }                   

    });

    socket.on('disconnect', function () {
      
        console.log('User disconected');        
        delete SocketList[socket.id];
        User.disconnect(socket);

    });

});

setInterval(function () {
    var lobbyData = {
        user: User.update()
    }


    for (var i in User.list)
    {
        var socket = SocketList[i];
        socket.emit('initLobbyUser', lobbyData);
        socket.emit('removeLobbyUser', removeLobbyUsers);
    }
    

    lobbyUsers.user = [];
    removeLobbyUsers.user = [];


}, 1000 / 25); //FPS

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
    console.log('initlobbyuser');
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

User.disconnect = function (socket)
{
    delete User.list[socket.id];
    removeLobbyUsers.user.push(socket.id);
}


User.getAllUserInfo = function ()
{
    var users = [];
    for (var i in User.list) {
        users.push(User.list[i].getInfo());
    }

    return users;
}


