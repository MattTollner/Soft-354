const express = require('express'),
      socketio = require('socket.io');
var app = express();
var server = app.listen(8080);
var io = socketio(server);

app.use(express.static('static'));


console.log("Server stared on port 8080");

io.on('connection', (socket) => {

    console.log('Socket ' + socket.id + ' just connected');

})