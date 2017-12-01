
$(document).ready(function () {
    alert('hello');

    $("#joinLobby").click(function () {
        if ($('#usernameInput').val != null) {
            socket.emit('testUnique', $('#usernameInput').val);
        } else { alert('Please enter a username') };

    });


});