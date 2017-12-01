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
            $('#userList').append('<li>' + User.list[i].username + '</li>');           
        }
    });

    socket.on('removeLobbyUser', function (data) {
        for (var i = 0; i < data.user.length; i++) {
            delete User.list[data.user[i]];
        }
    });

});

var User = function (data) {
    var self = {};
    self.id = data.id;
    self.username = data.username;
    User.list[self.id] = self;

    return self;
}

User.list = {};