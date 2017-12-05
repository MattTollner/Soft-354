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

var boxes = [];

{
    boxes.push({
        x: 10,
        y: 490,
        width: 80,
        height: 80
    });
    boxes.push({
        x: -10,
        y: 490,
        width: 515,
        height: 80
    });

    boxes.push({
        x: -10,
        y: 0,
        width: 515,
        height: 10
    });

    boxes.push({
        x: 0,
        y: -10,
        width: 10,
        height: 500
    });

    boxes.push({
        x: 500,
        y: -10,
        width: 10,
        height: 500
    });
    boxes.push({
        x: 220,
        y: 100,
        width: 80,
        height: 80
    });
    boxes.push({
        x: 270,
        y: 150,
        width: 40,
        height: 40
    });
}

friction = 0.8,
gravity = 0.3;
//Lobby data
var lobbyUsers = { user: [] };
var removeLobbyUsers = { user: [] };

//Game Data
var gameData = { player: [], bullet: [] };
var dataWorlds = [gameData, gameData, gameData];
var removeEntity = { player: [], bullet: [] };

io.on('connection', (socket) => {
    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

    socket.join('lobbyRoom');   

    
    

    socket.on('checkUsername', function (uname) {
       var unames = [];

        for (i in User.list) {
            unames.push(User.list[i].username);
        }
       
        if (unames.length < 1)
        {      
            joinRoom(socket, 'lobbyRoom');         

            socket.emit('checkUsernameResponse', { success: true, uname: uname });
            User.connection(socket, uname);
        } else {

            if (unames.includes(uname))
            {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });
                
            } else { 
                joinRoom(socket, 'lobbyRoom');          
                
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

    socket.on('console', function (data) {
       // //console.log('LOGGED : ' + data);
    });

    //Chat functions
    socket.on('lobbyChat', function (data) {
        //console.log('recifecved ' + data);       
        for (var i in User.list) {            
            SocketList[i].emit('printLobbyMsg', User.list[socket.id].username + ': ' + data);
        }
    });

    //Load game
    socket.on('startGame', function (data) {
        socket.emit('loadPlatforms', boxes);
        console.log('detected' + socket.rooms);     
        joinRoom(socket, 'gameRoom1');       

        console.log(data.username + " just joined room " + data.room);
        User.disconnect(socket);  
        Player.connect(socket, data.username, data.room);
    });



    

});

function joinRoom(socket, room) {
    Object.keys(socket.rooms).filter((r) => r != socket.id)
        //Leave the pre existing room
        .forEach((r) => socket.leave(r));

    socket.join(room);
}

setInterval(function () {
    var lobbyData = {
        user: User.update()
    }

    var r1Data =
        {
            player: Player.update('gameRoom'),
            bullet: Bullet.update(),
        };

    

    var r2Data =
        {
            player: Player.update('gameRoom2'),
            bullet: Bullet.update(),
        };

    io.sockets.in('lobbyRoom').emit('initLobbyUser', lobbyData);
    io.sockets.in('lobbyRoom').emit('removeLobbyUser', removeLobbyUsers);

    io.sockets.in('gameRoom').emit('initPlayer', dataWorlds[0]);
    io.sockets.in('gameRoom').emit('updatePlayer', r1Data);
    io.sockets.in('gameRoom').emit('removePlayer', removeEntity);

    io.sockets.in('gameRoom2').emit('initPlayer', dataWorlds[1]);
    io.sockets.in('gameRoom2').emit('updatePlayer', r2Data);
    io.sockets.in('gameRoom2').emit('removePlayer', removeEntity);

     for (var i in Player.list)
     {
         var socket = SocketList[i];

         socket.emit('initPlayer', dataWorlds[0]);
         socket.emit('updatePlayer', r1Data);
         socket.emit('removePlayer', removeEntity);
     }


    //for (var i in User.list)
    //{
    //    var socket = SocketList[i];
    //    socket.emit('initLobbyUser', lobbyData);
    //    socket.emit('removeLobbyUser', removeLobbyUsers);
    //}    

    lobbyUsers.user = [];
    removeLobbyUsers.user = [];

    dataWorlds[0].player = [];
    dataWorlds[0].bullet = [];
    dataWorlds[1].player = [];
    dataWorlds[1].bullet = [];
    removeEntity.player = [];
    removeEntity.bullet = [];



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


var Entity = function (room) {
    var self = {
        x: 250,
        y: 250,
        xSpeed: 0,
        ySpeed: 0,
        id: "",
        room: room,
    }
    self.update = function () {
        self.updatePosition();
    }
    self.updatePosition = function () {
        self.x += self.xSpeed;
        self.y += self.ySpeed;
    }

    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }

    return self;
}

var Player = function (id, room, username) {
    var self = Entity();
    self.id = id;
    self.room = room;
    self.username = username;
    self.width = 5;
    self.height = 5;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingSpace = false;
    self.maxSpd = 10,
    self.xVelocity = 0;
    self.yVelocity = 0,
    self.jumping = false;
    self.speed = 3;
    self.ammo = 15;
    self.grounded = false;
    self.mouseAngle = 32;
    self.mouseX = 0;
    self.mouseY = 0;
    self.playerHasShot = false;
    self.username = username;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;

    var originalUpdate = self.update;

    //Overwriting
    self.update = function ()
    {
        self.updatePosition();
        originalUpdate();
    }

    //Overwrite
    self.updatePosition = function ()
    {
        if (self.pressingUp) {
            if (!self.jumping) {
                self.jumping = true;
                self.grounded = false;
                self.yVelocity = -self.speed * 2;
            }
        }

        if (self.pressingRight) {
            if (self.xVelocity < self.speed) {
                self.xVelocity++;
            }
        }

        if (self.pressingLeft) {
            if (self.xVelocity > -self.speed) {
                self.xVelocity--;
            }
        }

        if (self.y >= 500 - self.height) {
            self.y = 500 - self.height;
            self.jumping = false;
            self.grounded = true;
        }

        self.xVelocity *= friction;
        self.yVelocity += gravity;


        self.grounded = false;
        for (var i in boxes) {
            var dir = checkForCollision(self, boxes[i]);

            if (dir === "l" || dir === "r") {
                self.xVelocity = 0;
                self.jumping = false;
            } else if (dir === "b") {
                self.grounded = true;
                self.jumping = false;
            } else if (dir === "t") {
                self.yVelocity *= -1;
            }
        }

        if (self.grounded) {
            self.yVelocity = 0;
        }


        self.x += self.xVelocity;
        self.y += self.yVelocity;

    
    }

    self.getPlayerInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            hpMax: self.hpMax,
            score: self.score,
            ammo: self.ammo,
        };
    }

    self.getUpdateInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score,
            ammo: self.ammo,
        };
    }


    Player.list[id] = self;

    if (room == 'gameRoom') {
        dataWorlds[0].player.push(self.getPlayerInfo());
        ////console.log('Player ' + dataWorlds[0].player[0].id);
    }
    else if (room == 'gameRoom2') {
        dataWorlds[1].player.push(self.getPlayerInfo());
        console.log('Player ' + dataWorlds[1].player[0].id);
    }

    return self;

}

Player.list = {}; //static

Player.getAllPlayerInfo = function (room) {
    var players = [];
    for (var i in Player.list) {
        if (Player.list[i].room == room) {
            players.push(Player.list[i].getPlayerInfo());
        }
    }
    return players;
}

Player.connect = function (socket, username, room) {
    var player = Player(socket.id, room, username);
    console.log('Player  ' + player.username + " connected to room : " + player.room);


    //Recives data of what key the player is pressing
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') { player.pressingLeft = data.state; }
        else if (data.inputId === 'right') { player.pressingRight = data.state; }
        else if (data.inputId === 'up') { player.pressingUp = data.state; }
        else if (data.inputId === 'down') { player.pressingDown = data.state; }
        else if (data.inputId === 'leftMouse') { player.pressingAttack = data.state; }
        // else if (data.inputId === 'mouseAngle') { player.mouseAngle = data.state; }
        else if (data.inputId === 'mouseAngle') {
            player.mouseX = data.state.x;
            player.mouseY = data.state.y;

        }
    });


    //Fills the client side arrays of all data from players and bullets
    socket.emit('initPlayer', {
        id: socket.id,      
        player: Player.getAllPlayerInfo(room),
        bullet: Bullet.getAllBulletInfo()
    });

}

Player.disconnect = function (socket) {
    delete Player.list[socket.id];
    removeEntity.player.push(socket.id);
}

Player.update = function (room) {
    //To be sent to all players - contains all players information
    var pInfo = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        if (player.room === room) {
        
            
            player.update();           
            pInfo.push(player.getUpdateInfo());
        }

    }
    return pInfo;    
}

var Bullet = function (parent, angle, room) {
    var self = Entity();
    self.room = room;
    console.log('bullet created at room ' + self.room);
    self.id = Math.random();
    self.xSpeed = Math.cos(angle / 180 * Math.PI) * 10;
    self.ySpeed = Math.sin(angle / 180 * Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.delBullet = false;
    var super_update = self.update;

    self.update = function () {
        if (self.timer++ > 100)
        {
            self.delBullet = true;
        }
            
        super_update();

        for (var i in Player.list) {
            var p = Player.list[i];

            if (self.getDistance(p) < 32 && self.parent !== p.id) {
                
                self.delBullet = true;
            }
        }

        for (var i in boxes) {
            var b = boxes[i];
            if (self.getDistance(b) < 32) {                
                self.delBullet = true;
            }
        }
    }


    self.getInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }

    self.getUpdateInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }

    Bullet.list[self.id] = self;
    if (room == 'gameRoom') {
        dataWorlds[0].bullet.push(self.getInfo());
        console.log('Player ' + dataWorlds[0].bullet[0].id);
    }
    else if (room == 'gameRoom2') {
        dataWorlds[1].bullet.push(self.getInfo());
        console.log('Player ' + dataWorlds[1].bullet[0].id);
    }

    return self;
    
}
Bullet.list = {};

Bullet.getAllBulletInfo = function () {
    var bullets = [];
    for (var i in Bullet.list) {
        bullets.push(Bullet.list[i].getInfo());
    }
    return bullets;
}


//Called every frame
Bullet.update = function () {


    var bInfo = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.delBullet) {
            delete Bullet.list[i];
            removeEntity.bullet.push(bullet.id);
        }
        else
        {
            bInfo.push(bullet.getUpdateInfo());
        }
            
    }
    return bInfo;
}

//Collision Checking
function checkForCollision(entity1, entity2) {

    var halfWidths = (entity1.width / 2) + (entity2.width / 2);
    var halfHeights = (entity1.height / 2) + (entity2.height / 2);
    var vX = (entity1.x + (entity1.width / 2)) - (entity2.x + (entity2.width / 2));
    var vY = (entity1.y + (entity1.height / 2)) - (entity2.y + (entity2.height / 2));     
   
    var  cDirection = null;

    
    if (Math.abs(vY) < halfHeights && Math.abs(vX) < halfWidths)
    {      
        var oX = halfWidths - Math.abs(vX), oY = halfHeights - Math.abs(vY);
        if (oX >= oY)
        {
            if (vY > 0)
            {
                cDirection = "t";
                entity1.y += oY;
            }
            else
            {
                cDirection = "b";
                entity1.y -= oY;
            }
        }
        else
        {
            if (vX > 0)
            {
                cDirection = "l";
                entity1.x += oX;
            } else 
            {
                cDirection = "r";
                entity1.x -= oX;
            }
        }
    }
    return cDirection;
}