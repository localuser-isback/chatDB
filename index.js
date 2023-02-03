console.clear()
process.on('uncaughtException', function(err) {
  //console.log('Caught exception: ' + err);

	//enable for global debug
});

const serveStatic = require('serve-static');
const http = require("http");
const fs = require('fs');
const app = require('express')();
const link = process.env['hook']
const { Webhook } = require('discord-webhook-node');
const hook = new Webhook(link);
const Filter = require('bad-words'),
	filter = new Filter();
var cors = require('cors')
const rateLimit = require('express-rate-limit');
const socketio = require("socket.io");
var Fingerprint = require('express-fingerprint');
server = http.Server(app);
const io = socketio(server);
console.log("Deps loaded...")

//Personal messages via websockets

app.use(cors())

var rooms = [];
var usernames = [];

io.on('connection', function(socket) {

	socket.on("join", function(room, username) {
		if (username != "") {
			rooms[socket.id] = room;
			usernames[socket.id] = username;
			socket.leaveAll();
			socket.join(room);
			io.in(room).emit("recieve", "Server : " + username + " has entered the chat.");
			socket.emit("join", room);
		}
	})

	socket.on("send", function(message) {
		io.in(rooms[socket.id]).emit("recieve", usernames[socket.id] + " : " + message);
	})

	socket.on("recieve", function(message) {
		socket.emit("recieve", message);
	})
})


//---------------------------------------------------------

//to get your has print our your finderprint hash and replace it with yours.
var adminhash = "7c11620cfbc02882a2e918f689b2beb2"

app.use(Fingerprint({
	parameters: [
		Fingerprint.useragent,
		Fingerprint.acceptHeaders,
		Fingerprint.geoip]
}));



//rate limit of chat API (50 requests every 5 min at max)
const msglimit = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 50,
	message: 'Currently sending WAY to many requests bud...',
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req, res) => {
		return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
	}
})
console.log("Ratelimit active");

//serve the captcha file

app.use(serveStatic(__dirname, { 'index': ['index.html'] }));
console.log("index served")

//set the time zone for when message is sent

process.env.TZ = 'America/Wash';
var datetime = new Date();
var currdate = datetime.toISOString().slice(0, 10)
var mindate = datetime.getUTCMinutes()
var hourdate = datetime.getUTCHours()
console.log("Time set.")

//heres the juicy part


try {
	app.get('/send', msglimit, function(req, res) {
		//prevent more messages then 100
		filePath = "chatDB.txt"
		fileBuffer =  fs.readFileSync(filePath);
		to_string = fileBuffer.toString();
		split_lines = to_string.split("\n");
		lines = split_lines.length-1
		if (lines >= 101) {
			let dbopenfile = fs.readFileSync("chatDB.txt").toString().split('\n');
			dbopenfile.shift();
			dbopenfile = dbopenfile.join('\n');
			fs.writeFileSync("chatDB.txt", dbopenfile);
		}
		var chatsend = req.query.inputC.substring(0, 250);
		var userN = req.query.userN.substring(0, 20);
		//replace with webhook UID from chatdb
		//blank space because middle man bot adds invisible ascii
		if (userN === " Ann6LewA") {
			res.send("Stopping webhook from repeating message.")
		}
		else {
			//pass
		}
		const block = fs.readFileSync('blocklist.txt').toString().split("\n");
		var cleansend = block.some(blist => chatsend.includes(blist));
		var cleanname = block.some(blist2 => userN.includes(blist2));
		try {
			if (cleansend === false) {
				if (cleanname === false) {
					//pass
				}
				else {
					try {
						res.send("DO NOT send anything in this blocklist, repeated offence will get you banned.")
						console.log("Someone being a goofy goober!");
						console.log("also ignore the error below (in logs) if it shows Error [ERR_HTTP_HEADERS_SENT] , thats the anti-spam saying it cant do what its supposed to do because the connection was closed.")
					} catch (err) {
						console.log("error stopping them. (look into this!)");
						res.send("DO NOT send anything in this blocklist, repeated offence will get you banned.")
					}
				}
			}
			else {
				try {
					res.send("DO NOT send anything in this blocklist, repeated offence will get you banned.")
					console.log("Someone being a goofy goober!");
					console.log("also ignore the error below (in logs) if it shows Error [ERR_HTTP_HEADERS_SENT] , thats the anti-spam saying it cant do what its supposed to do because the connection was closed.")
				} catch (err) {
					console.log("error stopping them. (look into this!)");
					res.send("DO NOT send anything in this blocklist, repeated offence will get you banned.")
				}
			}
		} catch (err) {
			console.log("VERIFY FAILED!");
			res.write("Blocklist verification failed!")
		}
		var userInput = filter.clean("<currdate>(" + currdate + " | " + "<hmin>" + hourdate + ":" + mindate + ")</hmin" + ")</currdate> " + "<style>hmin {color: slateblue;} b {color: cyan;} chat {color: cyan;} currdate {color: green; text-align:left}</style><b>" + userN + "</b>" + ": " + "<chat>" + chatsend + "</chat>" + "\n");
		if (userN.indexOf(" ") >= 0) {
			var userInput = filter.clean("<currdate>(" + currdate + " | " + "<hmin>" + hourdate + ":" + mindate + ")</hmin" + ")</currdate> " + "<style>hmin {color: slateblue;} b {color: cyan;} chat {color: cyan;} currdate {color: green; text-align:left} bot {color: yellow;}</style>"+"<bot> [Guilded] </bot>"+"<b>" + userN + "</b>" + ": " + "<chat>" + chatsend + "</chat>" + "\n");
		}
		try{
			hook.setUsername("User: "+filter.clean(userN));
			hook.send(filter.clean(chatsend));
		}
		catch (err){
			//pass
		}
		var buffed = Buffer.from(userInput).toString('base64')
		res.redirect(req.get('referer'));
		fs.appendFile('chatDB.txt', buffed + "\n", function(err) {
			if (err) {
				console.log(err);
			}
		});
	});
} catch (err) {
	console.log("Fatal Error!");
	console.log("--------------------------------------------------")
	console.log(err)
}

app.get('/active', function(req, res) {
	server.getConnections(function(error, count) {
		var activeusers = (Number(count) - 1).toString();
		fs.writeFile('users.txt', activeusers, () => { })
		res.send(activeusers);
	});
});

//admin panel functions.

//purge specific message
app.get('/purge', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			res.redirect(req.get('referer'));
			var select = req.query.Del;
			var msgs = fs.readFileSync('chatDB.txt').toString();
			var rmmsg = msgs.replace(select, '');
			select.replace(/\s/g, '')
			fs.writeFileSync('chatDB.txt', rmmsg);
		}
		catch (err) {
			console.log("Message does not exist: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});

//add item to blocklist
app.get('/addblock', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			res.redirect(req.get('referer'));
			var select = req.query.AddB;
			select.replace(/\s/g, '')
			fs.appendFile("blocklist.txt", select + "\n", (err) => {
				if (err) {
					console.log(err);
				}
			});
		}
		catch (err) {
			console.log("Error adding to blocklsit: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});

// get all messages in base64
app.get('/fmsg', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			var msgs = fs.readFileSync('chatDB.txt').toString().split("\n");
			res.send(msgs);
		}
		catch (err) {
			console.log("Error fetching msg: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});

//delete all duplicate messages
app.get('/xlpurge', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			const loopTime = 100;
			res.redirect(req.get('referer'));
			for (let i = 0; i < loopTime; i++) {
				var select = req.query.DelXL;
				var msgs = fs.readFileSync('chatDB.txt').toString();
				var rmmsg = msgs.replace(select, '');
				select.replace(/\s/g, '')
				fs.writeFileSync('chatDB.txt', rmmsg);
			}
		}
		catch (err) {
			console.log("Message does not exist: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});

//delete all messages

app.get('/rmall', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			res.redirect(req.get('referer'));
			fs.writeFile('chatDB.txt', '', function() { console.log('chat reset') })
		}
		catch (err) {
			console.log("Error deleting messages: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}
});

//create restore point in restore folder

app.get('/clone', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			res.redirect(req.get('referer'));
			fs.copyFile('chatDB.txt', './restore/chatrestore--' + currdate + '.txt', (err) => {
				if (err) throw err;
				console.log('chat restored');
			});
		}
		catch (err) {
			console.log("Error cloning chat: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});

//send a system message

app.get('/sysmsg', function(req, res) {
	console.log("Admin panel request sent, Hash of user: " + req.fingerprint.hash)
	if (req.fingerprint.hash == adminhash) {
		try {
			res.redirect(req.get('referer'));
			var select = req.query.sys;
			let buff = Buffer.from('<style>sys {color: red; font-size: 25px;} gg {color: green; font-size: 18px;}</style><sys>SYSTEM ADMIN MESSAGE: <gg>' + select + '</gg></sys>' + "\n");
			let selectb64 = buff.toString('base64');
			fs.appendFile("chatDB.txt", selectb64 + "\n", (err) => {
				if (err) {
					console.log(err);
				}
			});
		}
		catch (err) {
			console.log("Error adding to blocklsit: " + err);
		}
	}
	else {
		res.send("You do not have admin powers!");
	}

});


console.log("Loaded successfuly.")
//serve html file at localhost 3000

server.listen(3000);
