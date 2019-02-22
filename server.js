var express = require('express');
var app = express();
var server = require('http').Server(app);
server.listen(80);
var io = require('socket.io')(server);
var bodyParser = require('body-parser')
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
function isargv(str) {
    var p = false
    process.argv.forEach((st) => { if (str == st) p = true })
    return p
}
var games = [];
io.on('connection', function (socket) {
    socket.emit('setID', { ID: Math.floor(Math.random() * 100000) });
    socket.on('join', function (data) {
        console.log(data);
        if (games[data.gameID]) {
            if (games[data.gameID].started) {
                socket.emit('Error', { message: "The game has already started." })
                return;
            }
            socket.emit('Success', { gameID: data.gameID });
            games[data.gameID].started = true;
            games[data.gameID].player1.socket.emit('player', {});
            games[data.gameID].player2 = { ID: data.ID, socket: socket };
        } else socket.emit('Error', { message: "No game found!" })
    });
    socket.on('create', function (data) {
        console.log(data);
        if (games[data.gameID]) {
            socket.emit('Error', { message: "Server Error. Page refresh needed." })
            return;
        }
        games[data.gameID].started = false;
        games[data.gameID].player1 = { ID: data.ID, socket: socket };
        socket.emit('Success', { gameID: data.gameID });
    })
    socket.on('sclick', function (data) {
        if (!games[data.gameID]) return;
        if (games[data.gameID].player1.ID == data.ID) {
            games[data.gameID].player2.socket.emit('sclick', data);
            return;
        }
        if (games[data.gameID].player2.ID == data.ID) {
            games[data.gameID].player1.socket.emit('sclick', data);
            return;
        }
    })
});
process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
    input = input.toString().trim()
    try {
        eval(input)
    } catch (err) {
        console.error(err.toString())
    }
})
var server = app.listen(7777, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server started at: http://" + host + ":" + port)
})
if (isargv('--buildtest')) {
    console.log('Using build mode,exiting in 3secs.')
    setTimeout(() => { process.emit('SIGINT') }, 3000)
}