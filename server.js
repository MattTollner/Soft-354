const express = require('express'),
      socketio = require('socket.io');
var app = express();
var server = app.listen(8080);
var io = socketio(server);

app.use(express.static(__dirname + '/public')); 

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

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

    socket.join('lobbyRoom');
    
    console.log(socket.rooms);
    
    

    socket.on('checkUsername', function (uname) {
       var unames = [];

        for (i in User.list) {
            unames.push(User.list[i].username);
        }
       
        if (unames.length < 1)
        {      
            leaveRooms(socket);
            //Time out to 0 to ensure it get to the next event loop
            setTimeout(() => {
                socket.join('lobbyRoom');
            }, 0);

            socket.emit('checkUsernameResponse', { success: true, uname: uname });
            User.connection(socket, uname);
        } else {

            if (unames.includes(uname))
            {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });
                
            } else { 
                leaveRooms(socket);
                //Time out to 0 to ensure it get to the next event loop
                setTimeout(() => {
                    socket.join('lobbyRoom');
                }, 0);


                socket.emit('event', uname + ' joined the lobby');
                socket.broadcast.to('lobbyRoom').emit('event', uname + ' joined room lobbyRoom');
                socket.emit('checkUsernameResponse', { success: true, uname: uname });
                User.connection(socket, uname);                
            }           
        }                   

    });

    socket.on('disconnect', function () {
      
        console.log('User disconected');  
        for (var i in User.list) {
            SocketList[i].emit('printLobbyMsg', 'SERVER : ' + User.list[socket.id].username + ' has disconnected.');
        }
        delete SocketList[socket.id];
        User.disconnect(socket);
        

    });

    //Chat functions
    socket.on('lobbyChat', function (data) {
        console.log('recifecved ' + data);       
        for (var i in User.list) {            
            SocketList[i].emit('printLobbyMsg', User.list[socket.id].username + ': ' + data);
        }
    });

    //Load game
    socket.on('startGame', function (data) {
        console.log('detected' + socket.rooms);     

        io.sockets.in('lobbyRoom').emit('alert');
    });

});

function leaveRooms(socket) {
    Object.keys(socket.rooms).filter((r) => r != socket.id)
        //Leave the pre existing room
        .forEach((r) => socket.leave(r));
}

setInterval(function () {
    var lobbyData = {
        user: User.update()
    }


    io.sockets.in('lobbyRoom').emit('initLobbyUser', lobbyData);
    io.sockets.in('lobbyRoom').emit('removeLobbyUser', removeLobbyUsers);

    //for (var i in User.list)
    //{
    //    var socket = SocketList[i];
    //    socket.emit('initLobbyUser', lobbyData);
    //    socket.emit('removeLobbyUser', removeLobbyUsers);
    //}    

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
    socket.emit('initLobbyUser', {
        id: socket.id,
        user: User.getAllUserInfo(),
    });

    for (var i in User.list) {
        SocketList[i].emit('printLobbyMsg', 'SERVER : ' + User.list[socket.id].username + ' has joined the lobby.');
    }
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


