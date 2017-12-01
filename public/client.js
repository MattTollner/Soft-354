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
            thisUserName = data.uname;            
        }
        else if (!data.success) {
                 
            alert(data.uname + ' already in use');

        }
    });


});