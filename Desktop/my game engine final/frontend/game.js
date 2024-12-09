const socket = io.connect('http://localhost:3000');


const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');


//CHAT
//send message
messageForm.addEventListener('submit', e => {
   e.preventDefault();//prevent default form submission to stop page from reloading
   const message = messageInput.value;
   console.log(message);
   appendMessage(message, 'You');
   socket.emit('send-chat-message', message);
   messageInput.value = '';
});
//get message
socket.on('chat-message', data => appendMessage(data.message, data.name));


socket.on('user-connected', name => {
   appendMessage(`${name} has joined the game`);
});


socket.on('user-disconnected', name => {
   appendMessage(`${name} has left the game`);
});


function appendMessage(message, name = 'server') {
   const messageElement = document.createElement('div');
   messageElement.classList.add('message');
   console.log(name);
   messageElement.innerText = `${name} : ${message}`;
   if (name === 'server') messageElement.classList.add('servermessage');
   messageContainer.appendChild(messageElement);
   // autoscroll to bottom
   messageContainer.scrollTop = messageContainer.scrollHeight;
}


//JOIN GAME
const name = prompt('Enter your name');
appendMessage('joined the game', 'you');
socket.emit('new-user', name);
socket.on('receive-drawing', drawing => {
   console.log('received drawing');
   const img = new Image();
   img.onload = () => ctx.drawImage(img, 0, 0);
   img.src = drawing;
});


//DRAW
const canvas = document.querySelector('#draw'); //draw element
const ctx = canvas.getContext('2d');//canvas context -> gives tools to make drawings 


socket.on('message', socket => console.log(socket));


socket.on('draw', data => {
   isDrawing = true;
   console.log('received coords');
   draw(data);


   isDrawing = false;
});
socket.on('startdraw', startDraw);
socket.on('stopdraw', stopDraw);


socket.on('clearcanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height));


ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000000';


let isDrawing = false;
let lastX = -1;
let lastY = -1;
let hue = 0;
linewidth = 0;


function draw(e) {
   if (!isDrawing) return;
   ctx.strokeStyle = `1, 86%, 50%)`;
   ctx.lineWidth = 10;
   ctx.beginPath();
   ctx.moveTo(lastX, lastY);
   ctx.lineTo(e.offsetX, e.offsetY);
   ctx.stroke();
   hue += 5;
   linewidth += 0.1;
   [lastX, lastY] = [e.offsetX, e.offsetY];
}


function startDraw() {
   isDrawing = true;
   [lastX, lastY] = [this.offsetX, this.offsetY];
}


function stopDraw() {
   isDrawing = false;
}


canvas.addEventListener('mousemove', (e) => {
   draw(e);
   if (isDrawing) {
       const { offsetX, offsetY } = e;
       socket.emit('draw', { offsetX: offsetX, offsetY: offsetY });
   }
});


canvas.addEventListener('mousedown', () => {
   if (myTurn) {
       startDraw();
       socket.emit('startdraw');
       console.log('DRAWWWWWWWWWING');
   } else {
       console.log('not your turn sorry');
   }
});


canvas.addEventListener('mouseup', () => {
   stopDraw();
   socket.emit('stopdraw');
});


canvas.addEventListener('mouseout', () => {
   stopDraw();
   socket.emit('stopdraw');
});


socket.on('send-drawing', () => {
   const drawing = canvas.toDataURL();
   socket.emit('whole-drawing', drawing);
   console.log('Sending back drawing');
});


// GAME
let myTurn = false;
socket.on('your-turn', function (msg) {
   myTurn = true;
   getWords();
});


socket.on('stop-turn', () => myTurn = false);
socket.on('itsyourturn', () => {
   socket.emit('myturn');
});


function getWords() {
   const wordList = ["window", "house", "car", "carrot", "cat", "hand", "strawberry", "house", "flower", "eye"];
   const selectedWords = wordList.sort(() => 0.5 - Math.random()).slice(0, 3);
   chooseWord(selectedWords);
}


function chooseWord(words) {
   let word = 'placeholder';
   console.log('Choose a word');
   const container = document.querySelector('.canvascontainer');
   const text = document.createElement('div');
   const textContainer = document.createElement('div');
   const buttonContainer = document.createElement('div');
   textContainer.classList.add('choose-word');
   textContainer.classList.add('choose-word-text');
   buttonContainer.setAttribute('choose_word', 'note');
   text.innerText = "It's your turn to draw! Choose a word: ";


   const buttons = words.map(word => {
       const button = document.createElement("button");
       button.classList.add('word-button');
       button.innerHTML = word;
       button.addEventListener("click", () => setWord(button));
       return button;
   });


   buttons.forEach(button => buttonContainer.appendChild(button));


   textContainer.appendChild(text);
   textContainer.appendChild(buttonContainer);
   container.insertBefore(textContainer, container.firstChild);


   function setWord(button) {
       console.log('clicked button');
       word = button.innerHTML;
       socket.emit('get-word', word);
       container.removeChild(textContainer);
   }
}


socket.on('game-update', ({ players, gameState }) => updateGame({ players, gameState }));


function updateGame({ players, gameState }) {
   const cardcontainer = document.querySelector('.cardsflexcontainer');
   cardcontainer.innerHTML = '';
   Object.keys(players).forEach(key => {
       const playercard = document.createElement('div');
       playercard.classList.add('playercard');
       const playerName = document.createElement('span');
       const isDrawing = document.createElement('span');


       playercard.innerText = players[key].name;
       if (players[key].drawing) {
           isDrawing.innerText = ' is drawing!';
           playercard.classList.add('isdrawing');
       }


       playercard.appendChild(playerName);
       playercard.appendChild(isDrawing);


       cardcontainer.appendChild(playercard);
   });


   console.log(players);
   console.log(gameState);
}



