var socket = io({ transports: ['websocket'], upgrade: false });
var thisUserName = "";
var ctx = document.getElementById("ctx").getContext("2d");

var boxes = [];

$(document).ready(function () {    

    $("#joinLobby").click(function () {
       

        if ($("#userInput").val().length === 0) {
            alert('Please enter a username');
        } else 
        {
            socket.emit('checkUsername', $("#userInput").val())
        }   

    });

    $('#toLobby').click(function () {      

    });

    socket.on('loadPlatforms', function (data) {
        ctx.clearRect(0, 0, 500, 500);
        for (var i = 0; i < data.length; i++) {
            boxes.push(data[i]);
        }

    });

    socket.on('checkUsernameResponse', function (data) {
        if (data.success) {
            $('#loginDiv').hide();
            $('#lobbyDiv').show();
            thisUserName = data.uname
            
        }
        else if (!data.success) {                 
            alert(data.uname + ' already in use');
        }
    });

    socket.on('initLobbyUser', function (data) {
        
        for (var i = 0; i < data.user.length; i++) {
            new User(data.user[i]);           
        }

        $('#userList').empty();
        for (i in User.list) {
            $('#userList').append('<li class="list-group-item">' + User.list[i].username + '</li>');           
        }
    });

    socket.on('removeLobbyUser', function (data) {
        for (var i = 0; i < data.user.length; i++) {
            delete User.list[data.user[i]];
        }
    }); 

    //Lobby Chat Controls
    $('#lobbyChatForm').submit(function (e) {
        //Prevents page refresh
        e.preventDefault();           
         
            socket.emit('lobbyChat', $('#lobbyChatInput').val());
            $('#lobbyChatInput').val('');        
    });


    socket.on('printLobbyMsg', function (data) {
        $('#lobbyChat').append('<div>' + data + '</div >');
    });

    

    //Game load
    $('#toGame1').click(function () {
        $('#loginDiv').hide();
        $('#lobbyDiv').hide();
        $('#gameDiv').show();

        socket.emit('startGame', { room: 'gameRoom1', username: thisUserName });
    });

    var addLi = (message) => {
        $('#userList').append('<li class="list-group-item">' + message + '</li>');
    };

    socket.on('event', addLi);

    //Game
    socket.on('initPlayer', function (data) {  
        
        for (var i = 0; i < data.player.length; i++) {
            new Player(data.player[i]);

        }
        for (var i = 0; i < data.bullet.length; i++) {
            new Bullet(data.bullet[i]);
        }
    });

    socket.on('updatePlayer', function (data) {       
        for (var i = 0; i < data.player.length; i++) {
          
            var updatedP = data.player[i];
            if (i === 0) {
                //console.log('PRESSING RIGHT = ' + updatedP.pressingRight);
                //socket.emit('console', updatedP.pressingRight);
            }
            var player = Player.list[updatedP.id];
            if (player) {
                if (updatedP.x !== undefined) { player.x = updatedP.x; }
                if (updatedP.y !== undefined) { player.y = updatedP.y; }
                if (updatedP.hp !== undefined) { player.hp = updatedP.hp; }
                if (updatedP.score !== undefined) { player.score = updatedP.score; }
                if (updatedP.ammo !== undefined) { player.ammo = updatedP.ammo; }
            }
        }
        for (var i = 0; i < data.bullet.length; i++) {
            var updatedB = data.bullet[i];
            var bullet = Bullet.list[data.bullet[i].id];
            if (bullet) {
                if (updatedB.x !== undefined) { bullet.x = updatedB.x; }
                if (updatedB.y !== undefined) { bullet.y = updatedB.y; }            
            }
        }
    });

    socket.on('removePlayer', function (data) {        
        for (var i = 0; i < data.player.length; i++)
        {
            delete Player.list[data.player[i]];
        }
        for (var i = 0; i < data.bullet.length; i++)
        {
            delete Bullet.list[data.bullet[i]];
        }
    });


    //Keypresses 
    document.onkeydown = function (key) {
        //S
        if (key.keyCode === 68) { socket.emit('keyPress', { inputId: 'right', state: true }); }
        //D
        else if (key.keyCode === 83) { socket.emit('keyPress', { inputId: 'down', state: true }); }
        //A
        else if (key.keyCode === 65) { socket.emit('keyPress', { inputId: 'left', state: true }); }
        //W        
        else if (key.keyCode === 87) { socket.emit('keyPress', { inputId: 'up', state: true }); }
        //Space
        else if (key.keyCode === 32) { socket.emit('keyPress', { inputId: 'space', state: true }); }

    }
    document.onkeyup = function (event) {
        //D
        if (event.keyCode === 68) { socket.emit('keyPress', { inputId: 'right', state: false }); }
        //S
        else if (event.keyCode === 83) { socket.emit('keyPress', { inputId: 'down', state: false }); }
        //A
        else if (event.keyCode === 65) { socket.emit('keyPress', { inputId: 'left', state: false }); }
        //W
        else if (event.keyCode === 87) { socket.emit('keyPress', { inputId: 'up', state: false }); }
    }


});

setInterval(function () { 
    ctx.clearRect(0, 0, 500, 500);
    for (var i in boxes) {
        ctx.fillStyle = 'black';
        ctx.fillRect(boxes[i].x - 5, boxes[i].y, boxes[i].width, boxes[i].height);
    }
    for (var i in Player.list) {
        Player.list[i].draw();
    }

    for (var i in Bullet.list) {
        Bullet.list[i].draw();
    }

}, 40);

var User = function (data) {
    var self = {};
    self.id = data.id;
    self.username = data.username;
    User.list[self.id] = self;

    return self;
}

User.list = {};

var Player = function (playerInfo) {
    var self = {};
    self.id = playerInfo.id;
    self.username = playerInfo.uname;
    self.x = playerInfo.x;
    self.y = playerInfo.y;
    self.hp = playerInfo.hp;
    self.hpMax = playerInfo.hpMax;
    self.ammo = playerInfo.ammo;
    self.score = playerInfo.score;
    Player.list[self.id] = self;

    self.draw = function () {
        ctx.fillStyle = 'green';
        ctx.fillText(self.ammo, self.x, self.y + 5);
        ctx.fillRect(self.x - 5, self.y - 5, 5, 5);
    }

    return self;
}

Player.list = {};

var Bullet = function (bulletInfo) {
    var self = {};
    self.id = bulletInfo.id;
    self.x = bulletInfo.x;
    self.y = bulletInfo.y;
    Bullet.list[self.id] = self;

    self.draw = function () {
        ctx.fillStyle = 'red';
        ctx.fillRect(self.x - 5, self.y - 5, 3, 3);
    }
    return self;
}

Bullet.list = {};
