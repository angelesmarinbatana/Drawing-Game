const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

app.use(express.static('frontend')); 

//serve index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let players = {};
let gameState = {};

// NEW CONNECTION
io.on('connection', function (socket) {
    socket.on('myturn', setPlayerDrawing);

    function setPlayerDrawing() {
        players[socket.id].drawing = true; //1st guy gets to draw 
        io.sockets.emit('game-update', { players, gameState });//updates all with game info 
        socket.emit('your-turn', "It's your turn!");//1st guy goes 1st 
        socket.broadcast.emit('stop-turn'); //no one else can go 
        socket.on('get-word', (newWord) => {//set word for 1st guy
            gameState = { playerDrawing: socket.id, word: newWord }; //update word
        });
        io.sockets.emit('clearcanvas');//clear the canvas 
    }

    // NEW PLAYER & GUESS 
    socket.on('new-user', name => {
        players[socket.id] = { id: socket.id, name: name, drawing: false };//add new player to list & update players
        io.sockets.emit('game-update', { players, gameState });
        //only 1st player goes 1st
        if (Object.keys(players).length === 1) {
            setPlayerDrawing();
        }

        console.log(`player ${name} has connected`);

        if (Object.keys(players).length > 1) {  //>1 player?
            console.log('Requested drawing from all'); 
            socket.broadcast.emit('send-drawing', 'send drawing');
            //send drawing
            socket.on('whole-drawing', drawing => {
                console.log('Sending drawing to', players[socket.id].name);
                socket.broadcast.emit('receive-drawing', drawing);
            });
        }
    });

    // CHAT & WORD GUESS
    socket.on('send-chat-message', msg => handleMessage(msg));

    function handleMessage(message) {
        //message contains word & player is not drawing
        if (message.toLowerCase().includes(gameState.word) && players[socket.id].drawing === false) {
            if (message.toLowerCase() === gameState.word) { //exact match
                socket.emit('chat-message', {
                    message: "Correct! Your turn to draw",
                    name: 'server'
                });
                players[gameState.playerDrawing].drawing = false;//end turn

                setPlayerDrawing();//update next drawer

                socket.broadcast.emit('chat-message', {
                    message: `${players[socket.id].name} has found the word!`,
                    name: 'server'//word was found
                });
            }
        } else { //normal message
            socket.broadcast.emit('chat-message', {
                message: message,
                name: players[socket.id].name
            });
        }
    }

    // DRAWING
    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });
    socket.on('startdraw', (data) => {
        socket.broadcast.emit('startdraw');
    });
    socket.on('stopdraw', (data) => {
        socket.broadcast.emit('stopdraw');
    });
});

const port = 3000;
server.listen(port, function () {
    console.log('listening on port ', port);
});
