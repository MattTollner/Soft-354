var socket = io({ transports: ['websocket'], upgrade: false });
var thisUserName = "";


$(document).ready(function () {    

    $("#joinLobby").click(function () {
       

        if ($("#userInput").val().length === 0) {
            alert('Please enter a username');
        } else 
        {
            socket.emit('checkUsername', $("#userInput").val())
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

    socket.on('alert', function () {
        alert('Test Ale');
    });

    //Game load
    $('#toGame1').click(function () {
        //$('#loginDiv').hide();
        //$('#lobbyDiv').hide();
        //$('#gameDiv').show();

        socket.emit('startGame', { room: 'gameRoom1', username: thisUserName });
    });

    var addLi = (message) => {
        $('#userList').append('<li class="list-group-item">' + message + '</li>');
    };

    socket.on('event', addLi);


});

var User = function (data) {
    var self = {};
    self.id = data.id;
    self.username = data.username;
    User.list[self.id] = self;

    return self;
}

User.list = {};


