var socket;
var usernameInput
var chatIDInput;
var messageInput;
var chatRoom;
var dingSound;
var messages = [];
var delay = true;


function onload() {
  socket = io();
  usernameInput = document.getElementById("NameInput");
  chatIDInput = document.getElementById("IDInput");
  messageInput = document.getElementById("ComposedMessage");
  chatRoom = document.getElementById("RoomID");
  dingSound = document.getElementById("Ding");

  socket.on("join", function(room) {
    chatRoom.innerHTML = "Refer : " + room;
  })

  socket.on("recieve", function(message) {
    if (messages.length < 9) {
      messages.push(message);
    }
    else {
      messages.shift();
      messages.push(message);
    }
    for (i = 0; i < messages.length; i++) {
      document.getElementById("Message" + i).innerHTML = messages[i];
      document.getElementById("Message" + i).style.color = "lightcyan;"
    }
  })
}

function Connect() {
  socket.emit("join", chatIDInput.value, usernameInput.value);
}

function Send() {
  if (delay && messageInput.value.replace(/\s/g, "") != "") {
    delay = false;
    setTimeout(delayReset, 1000);
    socket.emit("send", messageInput.value);
    messageInput.value = "";
  }
}

function delayReset() {
  delay = true;
}


var input = document.getElementById("ComposedMessage");

input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    document.getElementById("SendMessage").click();
  }
});

function buttonCode() {
  void (0)
}

function disableClick() {
  void (0)
}

var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();